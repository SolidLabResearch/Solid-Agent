import {OpenHABActor} from "../openHAB/OpenHABActor";
import {SolidActor} from "../solid/SolidActor";
import {DataFactory, Quad, Store, Writer} from "n3";
import {isomorphic} from "rdf-isomorphic";
import {storeToString, turtleStringToStore} from "@treecg/versionawareldesinldp";
import {Readable, Transform, TransformCallback} from "stream";
import {v4 as uuidv4} from "uuid";
import {EyeJsReasoner} from "koreografeye";
import {extractPolicies} from "koreografeye/dist/policy/Extractor";
import {getLogger} from 'log4js';
import namedNode = DataFactory.namedNode;

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

        const transformer = new Transform({
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

        const test = stream.pipe(transformer)

            test.on('data', async event => {
                // reasoner has to be put here, otherwise it would always have all messages as input? // todo: ask Jesse, Patrick or Jos
                // reason -> data is a list and does not get cleared during `cleanup` -> maybe create issue
                const reasoner = new EyeJsReasoner([
                    "--quiet",
                    "--nope",
                    "--pass"
                ])
                const result = await reasoner.reason(await turtleStringToStore(event.announcement), this.rules)
                const resultString = storeToString(result)
                const regexApplied = resultString.replace(/file:\/\/\//g, "")
                const policies = await extractPolicies(await turtleStringToStore(regexApplied), 'no_idea', {}, getLogger())

                for (const policy of Object.values(policies)) {
                    switch (policy.target) {
                        case 'http://example.org/hasStateChanged':
                            const updatedState = updateState(this.state, event.data)
                            if (hasChanged(updatedState, this.state)) {
                                console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: status was changed, so sending message to myself now.`)
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
                            console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: start updating state in openhab.`)
                            this.state = event.data; // event data is the new state
                            for (const item of this.items) {
                                const itemQuads = extractItem(event.data, item);
                                this.openHABActor.storeItem(itemQuads)
                            }
                            break;
                        case 'http://example.org/updateSolidState':
                            console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: start updating state in solid.`)
                            this.state = event.data; // event data is the new state
                            this.solidActor.writeResource(this.solidStateResource, event.data)
                            break;
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

/**
 * Checks whether there is a difference
 * @return {boolean}
 * @param state1
 * @param state2
 */
function hasChanged(state1: Quad[], state2: Quad[]): boolean {
    return !isomorphic(state1, state2)
}

/**
 * Update the RDF state of items with a given item. (idempotent and safe function)
 *
 * The algorithm to execute this is the following:
 * subjects <- extract the subjects in the item quads
 * delete all quads which have as subject a subject in subjects
 * add item quads to the state
 * @param state RDF Quads
 * @param item RDF Quads that have to be added to the state (removing all previous notion to these quads from the state)
 * @return the updated state
 */
function updateState(state: Quad[], item: Quad[]): Quad[] {
    const stateStore = new Store(state)
    const subjects = new Store(item).getSubjects(null, null, null)

    for (const subject of subjects) {
        const quadsToRemove = stateStore.getQuads(subject, null, null, null);
        stateStore.removeQuads(quadsToRemove)
    }

    stateStore.addQuads(item)
    return stateStore.getQuads(null, null, null, null)
}

/**
 * Extract item Quads from the state given the subject identifier of the item.
 * Note: currently does not follow triples from the item, can be added in later versions of this function
 *
 * @param state
 * @param item
 */
function extractItem(state: Quad[], item: string): Quad[] {
    const store = new Store(state)
    return store.getQuads(namedNode(item), null, null, null)
}

async function testUpdateState() {
    const itemString = `
@prefix dbpedia: <http://dbpedia.org/resource/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix saref: <https://saref.etsi.org/core/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
<http://localhost:3000/Bureau_rechts_Color> dbpedia:Brightness 100 ;
dbpedia:Colorfulness 15 ;
dbpedia:Hue 0 ;
rdf:type saref:OnState .`
    const stateString = `
@prefix dbpedia: <http://dbpedia.org/resource/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix saref: <https://saref.etsi.org/core/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
<http://localhost:3000/Bureau_rechts_Color> dbpedia:Brightness 0 ;
    dbpedia:Colorfulness 0 ;
    dbpedia:Hue 0 ;
    rdf:type saref:OffState .
<http://localhost:3000/Bureau_links_Color> dbpedia:Brightness 0 ;
    dbpedia:Colorfulness 0 ;
    dbpedia:Hue 0 ;
    rdf:type saref:OffState .`

    const state = (await turtleStringToStore(stateString)).getQuads(null, null, null, null)
    const item = (await turtleStringToStore(itemString)).getQuads(null, null, null, null)
    const newState = updateState(state, item)
    console.log(storeToString(new Store(newState)))
}

// testUpdateState()
