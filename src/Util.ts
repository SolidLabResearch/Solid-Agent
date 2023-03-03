import {DCT, extractDateFromLiteral, storeToString, stringToStore} from '@treecg/versionawareldesinldp';
import {readFileSync} from 'fs';
import {Literal, Quad, Store} from 'n3';
// @ts-ignore
import Path from "path";
import {Actuation, IActuation} from './sosa/Actuation';
import {DBR, SAREF, SOSA} from './Vocabulary';
import {Result} from "./sosa/Result";
import {FeatureOfInterest} from "./sosa/FeatureOfInterest";
import {ActuatableProperty} from "./sosa/ActuatableProperty";

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

export interface PhilipsHueActuation extends IActuation {

}


async function main() {
    const baseIRI = 'http://example.org/'
    const store = await fileAsStore('./model/example.ttl', {baseIRI})

    // console.log('SOSA model as input\n', storeToString(store));
    // const state = calculatePhilipsHueState(store);
    // console.log('state as output\n', storeToString(state));


    const QueryEngine = require('@comunica/query-sparql').QueryEngine;
    const myEngine = new QueryEngine();

    // query that builds up platform with actuations
    const queryBody = `
    ?platform a <${SOSA.Platform}>.

    ?feature a <${SOSA.FeatureOfInterest}>;
        <${DCT.description}> ?featureDescription;
        <${DCT.title}> ?featureTitle.

    ?property a <${SOSA.ActuatableProperty}>;
        <${DCT.description}> ?propertyDescription.


    ?actuator a <${SOSA.Actuator}>.
    ?actuator <${SOSA.isHostedBy}> ?platform.

    ?actuation a <${SOSA.Actuation}>.
    ?actuation <${SOSA.madeByActuator}> ?actuator.
    ?actuation <${SOSA.hasFeatureOfInterest}> ?feature.
    ?actuation <${SOSA.actsOnProperty}> ?property.
    ?actuation <${SOSA.resultTime}> ?time.
    ?actuation <${SOSA.hasResult}> ?result.

    ?result a <${SOSA.Result}>.
    ?result <${DBR.Hue}> ?hue.
    ?result <${DBR.Brightness}> ?brightness.
    ?result <${DBR.Colorfulness}> ?saturation.
    ?result <${SAREF.hasState}> ?state_node.
    
    ?state_node a ?state.
    `
    // https://howtodoinjava.com/typescript/maps/
    // TODO: query to create a Map of Feature of Interests?

    // TODO: query to create a Map of ActuatableProperty?
    console.log(queryBody);

    // Note: Quad stream is not interesting in this scenario
    const quadStream = await myEngine.queryQuads(`
    CONSTRUCT WHERE {
    ${queryBody}
  } LIMIT 100`, {
        sources: [store],
    });
    const quads: Quad[] = await quadStream.toArray();
    // console.log(storeToString(new Store(quads)));

    const bindingsStream = await myEngine.queryBindings(`
    SELECT * WHERE {
    ${queryBody}
  } LIMIT 100`, {
        sources: [store],
    });
    const bindings = await bindingsStream.toArray();
    console.log('Number of actuations:', bindings.length);

    const actuations: IActuation[] = []
    for (const binding of bindings) {
        const actuatorId = binding.get('actuator').value!
        const actuationId = binding.get('actuation').value!
        const resultId = binding.get('result').value!
        const featureId = binding.get('feature').value!
        const propertyId = binding.get('property').value!
        const time = extractDateFromLiteral(binding.get('time') as Literal)

        // console.log('platform id:', binding.get('platform').value);
        // console.log('actuator id:', binding.get('actuator').value);
        // console.log('actuation id:', binding.get('actuation').value);
        // console.log('result id:', binding.get('result').value);
        // console.log('time:', extractDateFromLiteral(binding.get('time') as Literal));
        // console.log('state', binding.get('state').value);
        // console.log('feature (name)', binding.get('featureTitle').value);
        // console.log('state of feature (name)', binding.get('propertyDescription').value);
        const result = new Result(resultId)
        const foi = new FeatureOfInterest(featureId, {title: binding.get('featureTitle').value})
        const property = new ActuatableProperty(propertyId, {description: binding.get('propertyDescription').value})
        const actuation = new Actuation(actuationId, actuatorId, property, foi, result, time)
        console.log(storeToString(actuation.getStore()));
        actuations.push(actuation)
    }


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
    return await stringToStore(text, {contentType, baseIRI});
}


//     queryQuads<QueryFormatTypeInner extends QueryFormatType>(query: QueryFormatTypeInner, context?: QueryFormatTypeInner extends string ? QueryStringContextInner : QueryAlgebraContextInner): Promise<AsyncIterator<RDF.Quad> & RDF.ResultStream<RDF.Quad>>;
