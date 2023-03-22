import {OpenHABActor} from "../openHAB/OpenHABActor";
import {SolidActor} from "../solid/SolidActor";
import {Quad, Store, Writer} from "n3";
import {storeToString, turtleStringToStore} from "@treecg/versionawareldesinldp";
import {Readable, Transform, TransformCallback, Writable} from "stream";
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

/**
 * Checks whether the data from the event is isomorphic with state.
 * When it is not isomorphic, the data has changed, so an event is added to stream with an announcement to update an actor.
 * The updating of the actor is based on the policy.
 * @param event
 * @param stream
 * @param state
 */
async function fnoHasStateChanged(event: any, stream: Readable, state: Quad[]): Promise<void> {
    const policy = event.policy;
    const updatedState = updateState(state, event.data)
    if (hasChanged(updatedState, state)) {
        console.log(`${new Date().toISOString()} [${fnoHasStateChanged.name}] Received event from ${event.from} actor: state was changed, so sending message to myself now.`)
        const announcementString = `@prefix as: <https://www.w3.org/ns/activitystreams#>.
<${uuidv4()}> a as:Announce;
as:actor <orchestrator> ;
as:target <${policy.args['http://example.org/param1']!.value}>;
as:to <${policy.args['http://example.org/param2']!.value}>.
${new Writer().quadsToString(updatedState)}` // add updated state as data
        stream.push({
            from: 'Orchestrator',
            data: updatedState, // add updated state as data
            announcement: (await turtleStringToStore(announcementString)).getQuads(null, null, null, null)
        })
    } else {
        console.log(`${new Date().toISOString()} [${fnoHasStateChanged.name}] Received event from ${event.from} actor: No change detected.`)
    }
}

/**
 * Updates the state of the orchestration agent with the data of the event
 * Sends an action to the openHAB actor to the items based on the state.
 * @param event
 * @param orchAgent
 * @param items
 */
async function fnoUpdateOpenHABState(event: any, orchAgent: OrchestrationAgent, items: string[]): Promise<void> {
    const extractionResult = await extractAnnouncementArgs(event.announcement)
    console.log(`${new Date().toISOString()} [${fnoUpdateOpenHABState.name}] Received event from ${event.from} actor: start updating state in ${extractionResult.targetActor} actor to location ${extractionResult.targetEndpoint}.`)
    orchAgent.updateState(event.data)// event data is the new state
    for (const item of items) {
        const itemQuads = extractItem(event.data, item);
        orchAgent.openHABActor.storeItem(itemQuads)
    }
}

/**
 * Updates the state of the orchestration agent with the data of the event
 * Sends an action to the solid actor to the items based on the state.
 * @param event
 * @param orchAgent
 */
async function fnoUpdateSolidState(event: any, orchAgent: OrchestrationAgent): Promise<void> {
    const extractionResult = await extractAnnouncementArgs(event.announcement)
    console.log(`${new Date().toISOString()} [${fnoUpdateSolidState.name}] Received event from ${event.from} actor: start updating state in ${extractionResult.targetActor} actor to location ${extractionResult.targetEndpoint}.`)
    orchAgent.updateState(event.data)// event data is the new state
    orchAgent.solidActor.writeResource(extractionResult.targetEndpoint, event.data)
}

// adds activity streams to event
const createAnnouncementTransform = new Transform({
    objectMode: true,
    async transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        let announcementString
        switch (chunk.from) {
            case 'solid':
                announcementString = `
@prefix as: <https://www.w3.org/ns/activitystreams#>.
<${uuidv4()}> a as:Announce;
    as:actor <solid> ;
    as:object <${chunk.url}>. 
${new Writer().quadsToString(chunk.data)}`
                chunk.announcement = (await turtleStringToStore(announcementString)).getQuads(null, null, null, null)
                callback(null, chunk)
                break;
            case 'openHAB':
                announcementString = `
@prefix as: <https://www.w3.org/ns/activitystreams#>.
<${uuidv4()}> a as:Announce;
    as:actor <openHAB> ;
    as:object <${chunk.item}>. 
${new Writer().quadsToString(chunk.data)}`
                chunk.announcement = (await turtleStringToStore(announcementString)).getQuads(null, null, null, null)
                callback(null, chunk)
                break;
            case 'Orchestrator':
                callback(null, chunk)
                break
            default:
                console.log('We do not currently support following event')
                console.log(chunk)
                callback()
        }
    }
})

/**
 * Transforms the incoming Announcement stream to a stream now containing an additional property "reasoningResult"
 * This result is obtained by executing the Eye reasoner on the announcement data from an incoming chunk.
 *
 * Further regex is applied due to eye adding `file:///` to each relative URI.
 * Ask Jos De Roo <jos.deroo@ugent.be> for more information about why this is happening.
 */
class ReasoningTransform extends Transform {
    private rules: string[];

    constructor(rules: string[]) {
        super({objectMode: true})
        this.rules = rules;
    }

    async _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        const announcementStore = new Store(chunk.announcement)
        // Can be optimised in koreografeye by cleaning the data array after each run (can be implemented in the cleanup method)
        // then only one reasoner must ever be made
        const reasoner = new EyeJsReasoner([
            "--quiet",
            "--nope",
            "--pass"
        ])
        const result = await reasoner.reason(announcementStore, this.rules)
        const resultString = storeToString(result)
        const cleanedResult = (await turtleStringToStore(resultString.replace(/file:\/\/\//g, ""))).getQuads(null, null, null, null)
        chunk.reasoningResult = cleanedResult
        callback(null, chunk)
    }
}

/**
 * Transforms the incoming stream of events containing a payload, announcement and reasoning result
 * to a stream of events containing a policy and the same payload, announcement and reasoning result.
 *
 * The Policies are extracted by using an algorithm ({@link extractPolicies}) defined by {@link https://github.com/eyereasoner/Koreografeye|Koreografeye}.
 */
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

/**
 * Passes the incoming stream of events containing a payload, announcement, reasoning result and policy to the appropriate plugin functions.
 *
 * Currently, the plugins are based on the `fno:executes` property of the policy.
 * When no such plugins are found, nothing is executed.
 */
class PolicyExecuteTransform extends Writable {
    private stream: Readable;
    private orchestratorAgent: OrchestrationAgent;

    constructor(stream: Readable, orchestratorAgent: OrchestrationAgent) {
        super({objectMode: true})
        this.stream = stream;
        this.orchestratorAgent = orchestratorAgent

    }

    _write(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
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
                console.log(`${new Date().toISOString()} [${this.constructor.name}] No plugin available for identifier "${chunk.policy.target}"`)
        }
        callback()
    }
}
