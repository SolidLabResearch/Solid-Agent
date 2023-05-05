import {MessageClient, ReadWriteClient} from "../orchestration/OrchestrationActorInterface";
import {Readable} from "stream";
import {DataFactory, Quad} from "n3";
import {RDF} from "@solid/community-server";
import {AS} from "../Vocabulary";
import {v4 as uuidv4} from "uuid";
import {sleep} from "../Util";
import namedNode = DataFactory.namedNode;
import quad = DataFactory.quad;

export class GeneralSubscriptionClient implements MessageClient {
    private readClient: ReadWriteClient;
    private streams: Record<string, Readable>;
    private isSubscribed: boolean;
    private webID: string;
    private interval: number;

    public constructor(readClient: ReadWriteClient, webID: string, interval=5000) {
        this.readClient = readClient;
        this.streams = {};
        this.isSubscribed = false;
        this.webID = webID;
        this.interval = interval
    }

    public close(): void {
        for (const stream of Object.values(this.streams)) {
            stream.push(null);
        }
        this.streams = {}
        this.isSubscribed = false;
    }

    private async startSubscription(identifier: string, readable: Readable): Promise<void> {
        while (this.isSubscribed) {
            const announcement = createAnnouncement(this.webID, identifier)
            const data = await this.readClient.readResource(identifier);

            const event = {
                activity: announcement,
                data: data,
                from: this.webID,
                resourceURL: identifier
            }
            readable.push(event);
            await sleep(this.interval)
        } // can even manually be ended after while loop?
    }

    public async subscribe(identifier: string): Promise<Readable> {
        this.isSubscribed = true
        const stream = new Readable({
            objectMode: true,
            read() {
            }
        })
        this.streams[identifier] = stream;
        this.startSubscription(identifier, stream);
        return stream;
    }
}

export function createAnnouncement(webID: string, identifier: string): Quad[] {
    const uuid = uuidv4()

    const announcement = [
        quad(namedNode(uuid), RDF.terms.type, AS.terms.Announce),
        quad(namedNode(uuid), AS.terms.actor, namedNode(webID)),
        quad(namedNode(uuid), AS.terms.object, namedNode(identifier)),
    ]
    return announcement
}
