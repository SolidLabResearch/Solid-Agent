import {OpenHABClient} from "./OpenHABClient";
import {OpenHABRDFTranslator} from "./OpenHABRDFTranslator";
import {Actor, Event} from "../agent/OrchestrationActorInterface";
import {Readable} from "stream";
import {DataFactory, Quad} from "n3";
import {v4 as uuidv4} from "uuid";
import {RDF} from "@solid/community-server";
import {AS} from "../Vocabulary";
import {sleep} from "@treecg/versionawareldesinldp";
import namedNode = DataFactory.namedNode;
import quad = DataFactory.quad;

export class OpenHABActor implements Actor {
    private client: OpenHABClient;
    private translator: OpenHABRDFTranslator

    // when polling is done, the interval defines how often is polled
    private interval: number;
    private resources: string[]
    private isMonitoring: boolean

    private webID: string

    constructor(client: OpenHABClient, translator: OpenHABRDFTranslator, options?: { resources: string[] }) {
        this.client = client;
        this.translator = translator;
        this.interval = 5000;
        this.isMonitoring = false;
        this.resources = options ? options.resources : [];
        this.webID = 'openHAB'  // TODO: add real webid


    }

    async monitorResource(identifier: string, stream: Readable | undefined): Promise<void> {
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
                from: this.webID,
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

    async readResource(identifier: string): Promise<Quad[]> {
        // maybe some parsing of identifier?
        const item = await this.client.readItem(identifier)
        // item to RDF
        const quads = this.translator.translateItemToRDF(item)
        return quads
    }

    async writeResource(identifier: string, data: Quad[]): Promise<void> {
        // extract ID from data
        const itemName = await this.translator.fetchIdentifierFromRDF(data)
        // RDF to item
        const item = await this.translator.translateRDFToItem(data, itemName)
        await this.client.setItem(item)
    }
}
