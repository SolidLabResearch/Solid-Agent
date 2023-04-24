import {stringToStore} from '@treecg/versionawareldesinldp';
import {readFileSync} from 'fs';
import {Store} from 'n3';
// @ts-ignore
import Path from "path";

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

