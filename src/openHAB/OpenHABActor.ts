import {OpenHABClient} from "./OpenHABClient";
import {OpenHABRDFTranslator} from "./OpenHABRDFTranslator";
import {Quad} from "n3";

/**
 * V1: monitor an OpenHAB platform for changes in the state of item
 *
 * V2: monitor an OpenHAB platform for changes in the state of items
 */
export class OpenHABActor {
    private client: OpenHABClient;
    private translator: OpenHABRDFTranslator

    constructor(client: OpenHABClient, translator: OpenHABRDFTranslator) {
        this.client = client;
        this.translator = translator
    }

    public monitorItem(item: string) {
        // no idea yet how calling this method results in actually being subscribed.
        // Maybe by it being a stream?

    }

    /**
     * todo: error handling -> maybe return like a status of succession instead of void?
     * @param quads
     * @return {Promise<void>}
     */
    public async storeItem(quads: Quad[]): Promise<void> {
        // extract identifier of item -> maybe add as parameter, remember as2
        // todo: fix
        const id = 'Bureau_rechts_Color'
        // RDF to item
        const item = await this.translator.translateRDFToItem(quads, id)
        await this.client.setItem(item)
    }

    public async retrieveItem(identifier: string): Promise<Quad[]> {
        // maybe some parsing of identifier?
        const item = await this.client.readItem(identifier)
        // item to RDF
        const quads = this.translator.translateItemToRDF(item)
        return quads
    }
}

/**
 * Subgoals:
 * (i) retrieve the state of an item: check
 * (ii) map an item state object to an RDF representation of the said item: check
 * (iii) store the state of an item: check
 * (iv) map an RDF representation of the state of an item to an item state object: check
 * (v) subscribe to an item.
 */
