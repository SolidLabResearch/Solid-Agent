import {SolidClient} from "./src/solid/SolidClient";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {Actor, MessageClient} from "./src/orchestration/OrchestrationActorInterface";
import {Readable} from "stream";
import {Quad, Writer} from "n3";
import {SolidNotificationClient} from "./src/subscribe/SolidNotificationClient";

export class SolidActor implements Actor {
    private readonly client: SolidClient;
    // when polling is done, the interval defines how often is polled
    private interval: number;
    private _resources: string[]
    private isMonitoring: boolean

    private _webID: string

    private subscriptionClient: MessageClient;

    constructor(client: SolidClient, subscriptionClient: MessageClient, options?: { resources: string[], webID?: string }) {
        this.client = client
        this.subscriptionClient = subscriptionClient;
        this.interval = 5000;
        this.isMonitoring = false;
        this._resources = options ? options.resources : [];
        this._webID = options ? options.webID ?? 'solid' : 'solid';
    }

    get resources(): string[] {
        return this._resources
    }

    get webID(): string {
        return this._webID
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

    async monitorResources(stream?: Readable): Promise<void> {
        if (stream === undefined) {
            throw Error()
        }
        for (const resourceIdentifier of this.resources) {
            // no await otherwise it will wait on the first resource for infinite amount of time
            this.monitorResource(resourceIdentifier, stream)
        }
    }

    public async readResource(identifier: string): Promise<Quad[]> {
        return await this.client.readResource(identifier);
    }

    public async writeResource(identifier: string, quads: Quad[]): Promise<void> {
        await this.client.writeResource(identifier, quads);
    }
}

async function main() {
    const session = new Session()

    const solidClient = new SolidClient(session)

    // const subscriptionClient  = new GeneralSubscriptionClient(solidClient, 'solid', 10000);
    const subscriptionClient = new SolidNotificationClient(session, solidClient, 'solid')

    const solidActor = new SolidActor(solidClient, subscriptionClient, {resources: ['http://localhost:3000/state']})
    const stream = new Readable({
        objectMode: true,
        read() {
        }
    })
    solidActor.monitorResources(stream)
    stream.on('data', event => {
        console.log(`${new Date().toISOString()} Received event from ${event.from} actor.`)
        console.log(new Writer().quadsToString(event.activity))
    })
}

main()
