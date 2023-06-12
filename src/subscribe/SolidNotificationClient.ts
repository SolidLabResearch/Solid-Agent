import {MessageClient, ReadWriteClient} from "../orchestration/OrchestrationActorInterface";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {WebSocket} from 'ws'
import {Readable} from "stream";
import {WebSocketChannel2023} from "solid-notification-client";
import {turtleStringToStore} from "../Util";
import {createAnnouncement} from "./GeneralSubscriptionClient";

/**
 * The Solid Notification Client subscribes to a resource with its identifier.
 * When the resource is updated, it returns the current representation of the resource by fetching it with a {@link ReadWriteClient}.
 */
export class SolidNotificationClient implements MessageClient {
    protected session: Session;
    protected client: ReadWriteClient;
    protected webID: string;
    protected sockets: Record<string, WebSocket>;
    protected streams: Record<string, Readable>;

    protected channel: WebSocketChannel2023;

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
        const socket = await this.connect(identifier);
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

    /**
     * Sets up a websocket for the resource
     * @param identifier
     * @return {Promise<void>}
     */
    protected async connect(identifier: string): Promise<WebSocket> {
        const features = {"accept": "text/turtle"}
        const webSocketUrl = await this.channel.subscribe(identifier, features)
        const socket = new WebSocket(webSocketUrl);
        return socket
    }
}
