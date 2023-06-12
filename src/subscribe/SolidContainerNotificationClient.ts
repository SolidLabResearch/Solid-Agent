import {SolidNotificationClient} from "./SolidNotificationClient";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {ReadWriteClient} from "../orchestration/OrchestrationActorInterface";
import {Readable} from "stream";
import {turtleStringToStore} from "../Util";
import {createAnnouncement} from "./GeneralSubscriptionClient";
import {AS, RDF} from "@solid/community-server";

/**
 * The Solid Container Notification Client subscribes to a resource with its identifier.
 * When a resource is added, it returns the current representation of the resource by fetching it with a {@link ReadWriteClient}.
 * Note: is it allowed both to be added and updated?
 */
export class SolidContainerNotificationClient extends SolidNotificationClient {
    constructor(session: Session, client: ReadWriteClient, webID: string) {
        super(session, client, webID);
    }


    async subscribe(identifier: string): Promise<Readable> {
        const socket = await this.connect(identifier);
        const stream = new Readable({
            objectMode: true,
            read() {
            }
        })
        socket.onmessage = async (message) => {
            const notificationStore = await turtleStringToStore(message.data.toString())
            // only check newly created resource
            const asIdentifier = notificationStore.getQuads(null, RDF.type, AS.Add, null)[0].subject.value
            const createdResourceIdentifier = notificationStore.getQuads(asIdentifier, AS.object,null,null)[0].object.value

            const data = await this.client.readResource(createdResourceIdentifier);
            const announcement = createAnnouncement(this.webID, createdResourceIdentifier)

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
