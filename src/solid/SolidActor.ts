import {SolidClient} from "./SolidClient";
import {Quad} from "n3";
import {sleep} from "@treecg/versionawareldesinldp";
import {Readable} from "stream";

export class SolidActor {
    private readonly client: SolidClient;
    // when polling is done, the interval defines how often is polled
    private interval: number;
    private isMonitoring: boolean

    constructor(client: SolidClient) {
        this.client = client
        this.interval = 5000;
        this.isMonitoring = false;
    }

    public async monitorResource(identifier: string, stream: Readable) {
        // no idea yet how calling this method results in actually being subscribed.
        // Maybe by it being a stream?
        this.isMonitoring = true;
        while (this.isMonitoring) {
            const rdf = await this.readResource(identifier)
            stream.push({
                from: 'solid', // TODO: must this be the webid?
                data: rdf
            })
            await sleep(this.interval)
        }
    }
    public stopMonitoring(){
        this.isMonitoring = false;
    }

    public async readResource(identifier: string): Promise<Quad[]> {
        return await this.client.readResource(identifier);
    }

    public async writeResource(identifier: string, quads: Quad[]): Promise<void> {
        await this.client.writeResource(identifier, quads);
    }
}
