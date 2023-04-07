import {MessageClient, ReadWriteClient} from "../orchestration/OrchestrationActorInterface";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {WebSocket} from 'ws'
import {Readable} from "stream";
import {WebSocketChannel2023} from "solid-notification-client";
import {turtleStringToStore} from "@treecg/versionawareldesinldp";
import {createAnnouncement} from "./GeneralSubscriptionClient";

export class SolidNotificationClient implements MessageClient {
    private session: Session;
    private client: ReadWriteClient;
    private webID: string;
    private sockets: Record<string, WebSocket>;
    private streams: Record<string, Readable>;

    private channel: WebSocketChannel2023;

    public constructor(session: Session, client: ReadWriteClient, webID: string) {
        this.session = session;
        this.client = client;
        this.webID = webID;
        this.channel = new WebSocketChannel2023(session);
        this.streams = {};
        this.sockets = {};
    }

    public close(): void {
        for (const socket of Object.values(this.sockets)) {
            socket.close()
        }
        for (const stream of Object.values(this.streams)) {
            stream.push(null);
        }
        this.streams = {};
        this.sockets = {}
    }

    public async subscribe(identifier: string): Promise<Readable> {
        const features = {"accept": "text/turtle"}
        const webSocketUrl = await this.channel.subscribe(identifier, features)
        const socket = new WebSocket(webSocketUrl);
        const stream = new Readable({
            objectMode: true,
            read() {
            }
        })
        socket.onmessage = async (message) => {
            const notificationStore = await turtleStringToStore(message.data.toString())
            const notificationData = notificationStore.getQuads(null, null, null, null)
            // TODO: Check later whether I actually have to parse anything here
            const data = await this.client.readResource(identifier);
            const announcement = createAnnouncement(this.webID, identifier)

            const event = {
                activity: announcement,
                data: data,
                from: this.webID,
                resourceURL: identifier
            }
            stream.push(event)
        }
        this.streams[identifier] = stream
        this.sockets[identifier] = socket
        return stream;
    }

}
