import {Actor, MessageClient, ReadWriteClient} from "./orchestration/OrchestrationActorInterface";
import {Readable} from "stream";
import {Quad} from "n3";

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
