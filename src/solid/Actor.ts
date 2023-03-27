import {Actor, Event} from "../agent/OrchestrationActorInterface";
import {SolidClient} from "./SolidClient";
import {Readable} from "stream";
import {DataFactory, Quad} from "n3";
import {sleep} from "@treecg/versionawareldesinldp";
import {v4 as uuidv4} from "uuid";
import {RDF} from "@solid/community-server";
import {AS} from "../Vocabulary";
import namedNode = DataFactory.namedNode;
import quad = DataFactory.quad;

export class SolidActor implements Actor {
    private readonly client: SolidClient;
    // when polling is done, the interval defines how often is polled
    private interval: number;
    private resources: string[]
    private isMonitoring: boolean

    private webID: string

    constructor(client: SolidClient, options?: { resources: string[], }) {
        this.client = client
        this.interval = 5000;
        this.isMonitoring = false;
        this.resources = options ? options.resources : [];
        this.webID = 'solid'
    }

    async monitorResource(identifier: string, stream?: Readable): Promise<void> {
        if (stream === undefined) {
            throw Error()
        }

        this.isMonitoring = true;
        while (this.isMonitoring) {
            const rdf = await this.readResource(identifier)
            const uuid = uuidv4()
            const announcement = [
                quad(namedNode(uuid), RDF.terms.type, AS.terms.Announce),
                quad(namedNode(uuid), AS.terms.actor, namedNode(this.webID)),
                quad(namedNode(uuid), AS.terms.object, namedNode(identifier)),
            ]
            const event: Event = {
                activity: [...announcement, ...rdf],
                data: rdf,
                from: "solid", // TODO: add real webid
                resourceURL: identifier
            }
            stream.push(event)
            await sleep(this.interval)
        }
    }

    async monitorResources(stream?: Readable): Promise<void> {
        if (stream === undefined) {
            throw Error()
        }
        for (const resourceIdentifier of this.resources) {
            await this.monitorResource(resourceIdentifier, stream)
        }
    }

    public async readResource(identifier: string): Promise<Quad[]> {
        return await this.client.readResource(identifier);
    }

    public async writeResource(identifier: string, quads: Quad[]): Promise<void> {
        await this.client.writeResource(identifier, quads);
    }
}
