import {Actor, Event} from "../orchestration/OrchestrationActorInterface";
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
    private _resources: string[]
    private isMonitoring: boolean

    private _webID: string

    constructor(client: SolidClient, options?: { resources: string[], webID?: string }) {
        this.client = client
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

        this.isMonitoring = true;
        while (this.isMonitoring) {
            const rdf = await this.readResource(identifier)
            const uuid = uuidv4()
            const announcement = [
                quad(namedNode(uuid), RDF.terms.type, AS.terms.Announce),
                quad(namedNode(uuid), AS.terms.actor, namedNode(this._webID)),
                quad(namedNode(uuid), AS.terms.object, namedNode(identifier)),
            ]
            const event: Event = {
                activity: [...announcement, ...rdf],
                data: rdf,
                from: this._webID,
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
