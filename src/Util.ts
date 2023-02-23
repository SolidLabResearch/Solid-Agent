import { storeToString, stringToStore } from '@treecg/versionawareldesinldp';
import { readFileSync } from 'fs';
import { Store } from 'n3';
import Path from "path";

/**
 * Calculates the state of the lights based of a SOSA/SSN graph.
 * 
 * @param store - store containing the complete SOSA/SSN graph.
 */
function calculatePhilipsHueState(store: Store): Store {
    // parse whole platform f(store: Store): Platform

    // from the actuator(s), filter all actuations on featureOfInterest | f(platform: Platform): Key-Value<FoI: FeatureOfInterest, actuations: Actuation[]>

    // get most recent actuation per FeatureOfInterest f(Key-Value<FoI: FeatureOfInterest, actuations: Actuation[]): Actuation[]

    // transform actuations to state | f(actuations: Actuation[]): Store

    // return store

    return new Store()
}

interface PhilipsHueActuation {

}

interface Platform {
    hosts: Actuator[]
}

interface Actuator {
    madeActuation: Actuation
}

interface Actuation {
    actsOnProperty: ActuableProperty
    hasFeatureOfInterest: FeatureOfInterest
    hasResult: Result
    resultTime: Date
}

interface ActuableProperty {

}

interface FeatureOfInterest {

}

interface Result {

}

async function main() {
    const baseIRI = 'http://example.org/'
    const store = await fileAsStore('./model/sosa_model.ttl', { baseIRI })

    const state = calculatePhilipsHueState(store);
    console.log('SOSA model as input\n', storeToString(store));
    console.log('state as output\n', storeToString(state));


}
main()

/**
 * Convert a file as a store (given a path). Default will use text/turtle as content type
 * @param path
 * @param options
 * @returns {Promise<Store>}
 */
export async function fileAsStore(path: string, options?: { contentType?: string, baseIRI: string }): Promise<Store> {
    // only baseIRI if it is passed
    const baseIRI = options ? options.baseIRI : undefined;
    // text/turtle default, otherwise what is passed
    const contentType = options ? options.contentType ?? 'text/turtle' : 'text/turtle';
    const text = readFileSync(Path.join(path), "utf8");
    return await stringToStore(text, { contentType, baseIRI });
}