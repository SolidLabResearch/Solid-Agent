import {Actor, MessageClient, ReadWriteClient} from "./orchestration/OrchestrationActorInterface";
import {Readable} from "stream";
import {Quad} from "n3";
import {SolidClient} from "./solid/SolidClient";
import {OpenHABRDFTranslator} from "./openHAB/OpenHABRDFTranslator";
import {Item, OpenHABClient} from "./openHAB/OpenHABClient";

export abstract class AbstractActor implements Actor {
    protected readWriteClient: ReadWriteClient;
    protected subscriptionClient: MessageClient;
    protected _resources: string[];

    protected _webID: string;

    protected constructor(readWriteClient: ReadWriteClient, subscriptionClient: MessageClient, options?: { resources: string[], webID?: string }) {
        this.readWriteClient = readWriteClient;
        this.subscriptionClient = subscriptionClient;
        this._resources = options ? options.resources : [];
        this._webID = options ? options.webID ?? 'lol' : 'lol';
    }

    get resources(): string[] {
        return this._resources
    }

    get webID(): string {
        return this._webID
    }

    abstract monitorResource(identifier: string, stream?: Readable): Promise<void>;

    async monitorResources(stream?: Readable): Promise<void> {
        if (stream === undefined) {
            throw Error()
        }
        for (const resourceIdentifier of this.resources) {
            // no await otherwise it will wait on the first resource for infinite amount of time
            this.monitorResource(resourceIdentifier, stream)
        }
    }

    abstract readResource(identifier: string): Promise<Quad[]>;

    abstract writeResource(identifier: string, quads: Quad[]): Promise<void>;
}

export class SolidActor extends AbstractActor {
    constructor(client: SolidClient, subscriptionClient: MessageClient, options?: { resources: string[], webID?: string }) {
        super(client, subscriptionClient, options);
        this._webID = options ? options.webID ?? 'solid' : 'solid';

    }

    async monitorResource(identifier: string, stream?: Readable): Promise<void> {
        if (stream === undefined) {
            throw Error()
        }
        const subscriptionStream = await this.subscriptionClient.subscribe(identifier);
        subscriptionStream.on('data', data => {
            stream.push(
                {
                    activity: [...data.activity, ...(data.data as Quad[])],
                    data: data.data as Quad[],
                    from: data.from,
                    resourceURL: data.resourceURL
                }
            )
        })
    }

    async readResource(identifier: string): Promise<Quad[]> {
        return await this.readWriteClient.readResource(identifier) as Quad[];
    }

    async writeResource(identifier: string, quads: Quad[]): Promise<void> {
        await this.readWriteClient.writeResource(identifier, quads);
    }
}

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
