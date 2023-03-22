import {OpenHABActor} from "../openHAB/OpenHABActor";
import {SolidActor} from "../solid/SolidActor";
import {Quad, Store, Writer} from "n3";
import {storeToString, turtleStringToStore} from "@treecg/versionawareldesinldp";
import {Readable, Transform, TransformCallback} from "stream";
import {v4 as uuidv4} from "uuid";
import {EyeJsReasoner} from "koreografeye";
import {extractPolicies} from "koreografeye/dist/policy/Extractor";
import {getLogger} from 'log4js';
import {extractAnnouncementArgs, extractItem, hasChanged, updateState} from "./Util";

export interface OrchestrationAgentInterface {
    openHABActor: OpenHABActor
    solidActor: SolidActor,
    solidStateResource: string
    items: string[]
    rules: string[]
}

// This version monitors the components for changes
// updates are pushed to a stream
// handles multiple items
// adds a transformer to the stream to generate AS2 notifications
// proper reasoner added
// proper policy executer added (still hardcoded tho)
export class OrchestrationAgent {
    public readonly openHABActor: OpenHABActor; //TODO: make private again -> after fno plugins work properly
    public readonly solidActor: SolidActor; //TODO: make private again -> after fno plugins work properly
    public readonly items: string[]; //TODO: make private again -> after fno plugins work properly
    private readonly solidStateResource: string;

    public state: Quad[]; //TODO: make private again -> after fno plugins work properly
    private running = false;
    private rules: string[];

    constructor(config: OrchestrationAgentInterface) {
        this.solidActor = config.solidActor
        this.openHABActor = config.openHABActor
        this.solidStateResource = config.solidStateResource
        this.items = config.items
        this.state = []
        this.rules = config.rules
    }

    public async initialise() {
        // read all items
        const state = []
        for (const item of this.items) {
            const itemQuads = await this.openHABActor.retrieveItem(item)
            state.push(...itemQuads)
        }
        // store them all to the state resource on the solid pod
        await this.solidActor.writeResource(this.solidStateResource, state)
        // store them all to the internal state
        this.state = state
        console.log(`${new Date().toISOString()} [${this.constructor.name}] Succesfully initialised ${this.items.length} items.`)
    }

    public updateState(state: Quad[]): void {
        this.state = state
    }

    public startSyncService() {
        this.running = true
        const stream = new Readable({
            objectMode: true,
            read() {
            }
        })

        this.solidActor.monitorResource(this.solidStateResource, stream);
        this.openHABActor.monitorItems(this.items, stream);

        const reasonerstep = new ReasoningTransform(this.rules);
        const policyExtractTransform = new PolicyExtractTransform()
        const policyExecuteTransform = new PolicyExecuteTransform(stream, this)

        stream.pipe(createAnnouncementTransform)
            .pipe(reasonerstep)
            .pipe(policyExtractTransform)
            .pipe(policyExecuteTransform)
    }

    public stopService() {
        this.solidActor.stopMonitoring();
        this.openHABActor.stopMonitoring();
        this.running = false;
    }
}

function fnoHasStateChanged(event: any, stream: Readable, state: Quad[]): void {
    const policy = event.policy;
    const updatedState = updateState(state, event.data)
    if (hasChanged(updatedState, state)) {
        console.log(`${new Date().toISOString()} [${fnoHasStateChanged.name}] Received event from ${event.from} actor: state was changed, so sending message to myself now.`)
        stream.push({
            from: 'Orchestrator',
            data: updatedState, // add updated state as data
            announcement: `
@prefix as: <https://www.w3.org/ns/activitystreams#>.
<${uuidv4()}> a as:Announce;
as:actor <orchestrator> ;
as:target <${policy.args['http://example.org/param1']!.value}>;
as:to <${policy.args['http://example.org/param2']!.value}>.
${new Writer().quadsToString(updatedState)}` // add updated state as data
        })
    } else {
        console.log(`${new Date().toISOString()} [${fnoHasStateChanged.name}] Received event from ${event.from} actor: No change detected.`)
    }
}

async function fnoUpdateOpenHABState(event: any, orchAgent: OrchestrationAgent, items: string[]): Promise<void> {
    const extractionResult = await extractAnnouncementArgs(event.announcement)
    console.log(`${new Date().toISOString()} [${fnoUpdateOpenHABState.name}] Received event from ${event.from} actor: start updating state in ${extractionResult.targetActor} actor to location ${extractionResult.targetEndpoint}.`)
    orchAgent.updateState(event.data)// event data is the new state
    for (const item of items) {
        const itemQuads = extractItem(event.data, item);
        orchAgent.openHABActor.storeItem(itemQuads)
    }
}

async function fnoUpdateSolidState(event: any, orchAgent: OrchestrationAgent): Promise<void> {
    const extractionResult = await extractAnnouncementArgs(event.announcement)
    console.log(`${new Date().toISOString()} [${fnoUpdateSolidState.name}] Received event from ${event.from} actor: start updating state in ${extractionResult.targetActor} actor to location ${extractionResult.targetEndpoint}.`)
    orchAgent.updateState(event.data)// event data is the new state
    orchAgent.solidActor.writeResource(extractionResult.targetEndpoint, event.data)
}

// adds activity streams to event
const createAnnouncementTransform = new Transform({
    objectMode: true,
    transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        switch (chunk.from) {
            case 'solid':
                chunk.announcement = `
@prefix as: <https://www.w3.org/ns/activitystreams#>.
<${uuidv4()}> a as:Announce;
    as:actor <solid> ;
    as:object <${chunk.url}>. 
${new Writer().quadsToString(chunk.data)}`
                this.push(chunk)
                break;
            case 'openHAB':
                chunk.announcement = `
@prefix as: <https://www.w3.org/ns/activitystreams#>.
<${uuidv4()}> a as:Announce;
    as:actor <openHAB> ;
    as:object <${chunk.item}>. 
${new Writer().quadsToString(chunk.data)}`
                this.push(chunk)
                break;
            case 'Orchestrator':
                this.push(chunk)
                break
            default:
                console.log('We do not currently support following event')
                console.log(chunk)
        }
        callback();
    }
})

class ReasoningTransform extends Transform {
    private rules: string[];

    constructor(rules: string[]) {
        super({objectMode: true})
        this.rules = rules;
    }

    async _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        const announcementStore = await turtleStringToStore(chunk.announcement)
        const reasoner = new EyeJsReasoner([
            "--quiet",
            "--nope",
            "--pass"
        ])
        const result = await reasoner.reason(announcementStore, this.rules)
        const resultString = storeToString(result)
        const cleanedResult = (await turtleStringToStore(resultString.replace(/file:\/\/\//g, ""))).getQuads(null, null, null, null)
        chunk.reasoningResult = cleanedResult
        chunk.announcement = announcementStore.getQuads(null, null, null, null)
        this.push(chunk)
        callback()
    }
}

class PolicyExtractTransform extends Transform {
    constructor() {
        super({objectMode: true});
    }
    async _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        const extractedPolicies = await extractPolicies(new Store(chunk.reasoningResult), 'no_idea', {}, getLogger())
        const policies = Object.values(extractedPolicies)
        for (const policy of policies) {
            chunk.policy = policy
            this.push(chunk)
        }
        callback()
    }
}

class PolicyExecuteTransform extends Transform {
    private stream: Readable;
    private orchestratorAgent: OrchestrationAgent;

    constructor(stream: Readable, orchestratorAgent: OrchestrationAgent) {
        super({objectMode: true})
        this.stream = stream;
        this.orchestratorAgent = orchestratorAgent

    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        switch (chunk.policy.target) {
            case 'http://example.org/hasStateChanged':
                fnoHasStateChanged(chunk, this.stream, this.orchestratorAgent.state)
                break;
            case 'http://example.org/updateOpenHABState':
                fnoUpdateOpenHABState(chunk, this.orchestratorAgent, this.orchestratorAgent.items)
                break;
            case 'http://example.org/updateSolidState':
                fnoUpdateSolidState(chunk, this.orchestratorAgent)
                break;
            default:
                console.log(`${new Date().toISOString()} [policyExecuteTransform] No plugin available for identifier "${chunk.policy.target}"`)
        }
        callback()
    }
}
