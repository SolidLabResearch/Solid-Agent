import {OpenHABActor} from "../openHAB/OpenHABActor";
import {SolidActor} from "../solid/SolidActor";
import {DataFactory, Quad, Store} from "n3";
import {isomorphic} from "rdf-isomorphic";
import {storeToString, turtleStringToStore} from "@treecg/versionawareldesinldp";
import {Readable} from "stream";
import namedNode = DataFactory.namedNode;

export interface OrchestrationAgentInterface {
    openHABActor: OpenHABActor
    solidActor: SolidActor,
    solidStateResource: string
    items: string[]
}

// This version monitors the components for changes
// updates are pushed to a stream
// handles multiple items
export class OrchestrationAgent {
    private readonly openHABActor: OpenHABActor;
    private readonly solidActor: SolidActor;
    private readonly items: string[];
    private readonly solidStateResource: string;

    private state: Quad[];
    private running = false;

    constructor(config: OrchestrationAgentInterface) {
        this.solidActor = config.solidActor
        this.openHABActor = config.openHABActor
        this.solidStateResource = config.solidStateResource
        this.items = config.items
        this.state = []
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
        console.log(`[${new Date().toISOString()}] initialised`)
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

        stream.on('data', event => {
            let updatedState = []
            switch (event.from) {
                case 'solid':
                    updatedState = event.data
                    // Note: Does not work when the relative identifier gets updated to fixed one.
                    //  e.g. <http://localhost:3000/Bureau_rechts_Color> instead of <Bureau_rechts_Color>
                    //  can be solved by adding some prefix extracting item functionality
                    if (hasChanged(updatedState, this.state)) {
                        console.log(`[${new Date().toISOString()}] Received event from ${event.from} actor: start updating state in openhab.`)
                        this.state = updatedState;
                        for (const item of this.items){
                            const itemQuads = extractItem(updatedState, item);
                            this.openHABActor.storeItem(itemQuads)
                        }
                    } else {
                        console.log(`[${new Date().toISOString()}] Received event from ${event.from} actor: No change detected.`)
                    }
                    break;
                case 'openHAB':
                    updatedState = updateState(this.state, event.data);
                    if (hasChanged(updatedState, this.state)) {
                        console.log(`[${new Date().toISOString()}] Received event from ${event.from} actor: start updating state in solid.`)
                        this.state = updatedState;
                        this.solidActor.writeResource(this.solidStateResource, updatedState)
                    } else {
                        console.log(`[${new Date().toISOString()}] Received event from ${event.from} actor: No change detected.`)
                    }
                    break;
                default:
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
