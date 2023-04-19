import {OpenHABRDFTranslator} from "./OpenHABRDFTranslator";
import {Item, OpenHABClient} from "./OpenHABClient";
import {MessageClient} from "../orchestration/OrchestrationActorInterface";
import {Readable} from "stream";
import {Quad} from "n3";
import {AbstractActor} from "../AbstractActor";

export class OpenHABActor extends AbstractActor {
    private translator: OpenHABRDFTranslator;
    constructor(client: OpenHABClient, subscriptionClient: MessageClient,  translator: OpenHABRDFTranslator, options?: { resources: string[], webID?: string }) {
        super(client, subscriptionClient, options);
        this.translator = translator;
        this._webID = options ? options.webID ?? 'openHAB' : 'openHAB';
    }

    async monitorResource(identifier: string, stream?: Readable): Promise<void> {
        if (stream === undefined) {
            throw Error()
        }
        const subscriptionStream = await this.subscriptionClient.subscribe(identifier);
        subscriptionStream.on('data', data => {
            const rdfData = this.translator.translateItemToRDF(data.data as Item)
            stream.push(
                {
                    activity: [...data.activity, ...rdfData],
                    data: rdfData,
                    from: data.from,
                    resourceURL: data.resourceURL
                }
            )
        })       }

    async readResource(identifier: string): Promise<Quad[]> {
        // maybe some parsing of identifier?
        const item = await this.readWriteClient.readResource(identifier) as Item
        // item to RDF
        const quads = this.translator.translateItemToRDF(item)
        return quads
    }

    async writeResource(identifier: string, quads: Quad[]): Promise<void> {
        const item = await this.translator.translateRDFToItem(quads, identifier)
        await this.readWriteClient.writeResource(identifier, item);
    }
}
