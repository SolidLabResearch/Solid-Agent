import {DataFactory, Quad, Store} from "n3";
import {isomorphic} from "rdf-isomorphic";
import {QueryEngine} from "@comunica/query-sparql";
import {storeToString, turtleStringToStore} from "../Util";
import namedNode = DataFactory.namedNode;

/**
 * Checks whether there is a difference between two states (RDF graphs)
 * @return {boolean}
 * @param state1
 * @param state2
 */
export function hasChanged(state1: Quad[], state2: Quad[]): boolean {
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
export function updateState(state: Quad[], item: Quad[]): Quad[] {
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
export function extractItem(state: Quad[], item: string): Quad[] {
    const store = new Store(state)
    return store.getQuads(namedNode(item), null, null, null)
}

/**
 * Extract the target actor and target location parameters from an as:Announce payload.
 * @param announcement
 * @param queryEngine
 */
export async function extractAnnouncementArgs(announcement: Quad[], queryEngine?: QueryEngine) {
    queryEngine = queryEngine ?? new QueryEngine();
    const bindingsStream = await queryEngine.queryBindings(`
    PREFIX as: <https://www.w3.org/ns/activitystreams#>
        SELECT * WHERE {
    ?id a           as:Announce;
        as:target   ?targetActor;
        as:to       ?targetEndpoint
  } LIMIT 100
        `,
        {
            sources: [new Store(announcement)]
        })
    const bindings = await bindingsStream.toArray();
    if (bindings.length === 0) throw Error("No announcement arguments found in query")
    const targetActor = bindings[0].get('targetActor')
    const targetEndpoint = bindings[0].get('targetEndpoint')
    if (targetActor === undefined) throw Error("Could not find as:target value in announcement RDF.")
    if (targetEndpoint === undefined) throw Error("Could not find as:to value in announcement RDF.")
    return {
        targetActor: targetActor.value,
        targetEndpoint: targetEndpoint.value
    }
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
