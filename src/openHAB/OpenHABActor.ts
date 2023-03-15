import {OpenHABClient} from "./OpenHABClient";
import {OpenHABRDFTranslator} from "./OpenHABRDFTranslator";

/**
 * V1: monitor an OpenHAB platform for changes in the state of item
 *
 * V2: monitor an OpenHAB platform for changes in the state of items
 */
export class OpenHABActor {
    private client : OpenHABClient;
    private translator: OpenHABRDFTranslator

    constructor(client: OpenHABClient, translator: OpenHABRDFTranslator) {
        this.client = client;
        this.translator = translator
    }

    public monitorItem(item: string) {

    }
}
