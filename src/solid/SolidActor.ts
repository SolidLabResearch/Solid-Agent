import {SolidClient} from "./SolidClient";
import {MessageClient} from "../orchestration/OrchestrationActorInterface";
import {Readable} from "stream";
import {Quad} from "n3";
import {AbstractActor} from "../AbstractActor";

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
