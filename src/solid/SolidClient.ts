import {Quad, Writer} from "n3";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {parseContentType, TEXT_TURTLE} from "@solid/community-server";
import {turtleStringToStore} from "../Util";
import {ReadWriteClient} from "../orchestration/OrchestrationActorInterface";

export class SolidClient implements ReadWriteClient{
    private readonly session: Session;

    public constructor(session: Session) {
        this.session = session;
    }

    public async readResource(identifier: string): Promise<Quad[]> {
        const response = await this.session.fetch(identifier, {
            headers: {
                'accept': TEXT_TURTLE
            }
        })
        const contentTypeHeader = parseContentType(response.headers.get('content-type') ?? '')
        if (contentTypeHeader.value !== TEXT_TURTLE) throw Error('Can not parse ldp:resource as currently only "text/turtle" is supported. Content Type received: ' + contentTypeHeader.value)
        // Note: can be optimized by using https://github.com/rubensworks/rdf-parse.js
        const store = await turtleStringToStore(await response.text())
        return store.getQuads(null, null, null, null)
    }

    public async writeResource(identifier: string, quads: unknown): Promise<void>
    public async writeResource(identifier: string, quads: Quad[]): Promise<void> {
        const text = new Writer().quadsToString(quads);
        await this.session.fetch(identifier, {
            method: 'PUT',
            headers: {
                'content-type': TEXT_TURTLE
            },
            body: text
        })
    }
}

// const client = new SolidClient(new Session())
// client.readResource('https://woslabbi.pod.knows.idlab.ugent.be/profile/card#me')
// // client.readResource('https://www.openhab.org/addons/bindings/hue/') // will not work as it does not support text/turtle
// client.writeResource('http://localhost:3000/test', [quad(namedNode('a'), namedNode('a'), namedNode('a'))])
