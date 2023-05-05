import {readFileSync} from 'fs';
import {Store, Writer} from 'n3';
import {ParseOptions} from "rdf-parse/lib/RdfParser";
import * as Path from "path";

const rdfParser = require("rdf-parse").default;
const storeStream = require("rdf-store-stream").storeStream;
const streamifyString = require('streamify-string');

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


/**
 * Process that timeouts for a given amount of milliseconds
 * @param ms
 * @return {Promise<any>}
 */
export function sleep(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function turtleStringToStore(text: string, baseIRI?: string): Promise<Store> {
    return await stringToStore(text, {contentType: 'text/turtle', baseIRI});
}

/**
 * Converts a store to turtle string
 * @param store
 * @returns {string}
 */
export function storeToString(store: Store): string {
    const writer = new Writer();
    return writer.quadsToString(store.getQuads(null, null, null, null));
}

export async function stringToStore(text: string, options: ParseOptions): Promise<Store> {
    const textStream = streamifyString(text);
    const quadStream = rdfParser.parse(textStream, options);
    return await storeStream(quadStream);
}
