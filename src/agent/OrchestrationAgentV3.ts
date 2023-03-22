import {OpenHABActor} from "../openHAB/OpenHABActor";
import {SolidActor} from "../solid/SolidActor";
import {DataFactory, Quad, Writer} from "n3";
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
export class OrchestrationAgent {
    private readonly openHABActor: OpenHABActor;
    private readonly solidActor: SolidActor;
    private readonly items: string[];
    private readonly solidStateResource: string;

    private state: Quad[];
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

    public async startSyncService() {
        this.running = true
        const stream = new Readable({
            objectMode: true,
            read() {
            }
        })

        this.solidActor.monitorResource(this.solidStateResource, stream);
        this.openHABActor.monitorItems(this.items, stream);

        const addActorAnnouncements = new Transform({
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
                    default:
                }
                callback();
            }
        })

        const test = stream.pipe(addActorAnnouncements)

        test.on('data', async event => {
            // reasoner has to be put here, otherwise it would always have all messages as input?
            // reason -> data is a list and does not get cleared during `cleanup` -> maybe create issue
            const reasoner = new EyeJsReasoner([
                "--quiet",
                "--nope",
                "--pass"
            ])
            const result = await reasoner.reason(await turtleStringToStore(event.announcement), this.rules)
            const resultString = storeToString(result)
            const regexApplied = resultString.replace(/file:\/\/\//g, "")
            const extractedPolicies = await extractPolicies(await turtleStringToStore(regexApplied), 'no_idea', {}, getLogger())
            // console.log(extractedPolicies)
            const policies = Object.values(extractedPolicies)

            let extractionResult
            for (const policy of policies) {
                switch (policy.target) {
                    case 'http://example.org/hasStateChanged':
                        const updatedState = updateState(this.state, event.data)
                        if (hasChanged(updatedState, this.state)) {
                            console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: state was changed, so sending message to myself now.`)
                            test.push({
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
                            console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: No change detected.`)
                        }
                        break;
                    case 'http://example.org/updateOpenHABState':
                        this.state = event.data; // event data is the new state
                        extractionResult = await extractAnnouncementArgs((await turtleStringToStore(event.announcement)).getQuads(null, null, null, null))
                        console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: start updating state in ${extractionResult.targetActor} actor to location ${extractionResult.targetEndpoint}.`)

                        for (const item of this.items) {
                            const itemQuads = extractItem(event.data, item);
                            this.openHABActor.storeItem(itemQuads)
                        }
                        break;
                    case 'http://example.org/updateSolidState':
                        extractionResult = await extractAnnouncementArgs((await turtleStringToStore(event.announcement)).getQuads(null, null, null, null))
                        console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: start updating state in ${extractionResult.targetActor} actor to location ${extractionResult.targetEndpoint}.`)
                        this.state = event.data; // event data is the new state
                        this.solidActor.writeResource(extractionResult.targetEndpoint, event.data)
                        break;
                    default:
                        console.log(`${new Date().toISOString()} [${this.constructor.name}] No plugin available for identifier "${policy.target}"`)
                }
            }
        })
    }

    public stopService() {
        this.solidActor.stopMonitoring();
        this.openHABActor.stopMonitoring();
        this.running = false;
    }
}
