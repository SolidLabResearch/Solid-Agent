import {SolidClient} from "./SolidClient";
import {Quad} from "n3";

export class SolidActor {
    private readonly client: SolidClient;

    constructor(client: SolidClient) {
        this.client = client
    }

    public monitorResource(identifier: string) {

    }

    public async readResource(identifier: string): Promise<Quad[]> {
        return await this.client.readResource(identifier);
    }

    public async writeResource(identifier: string, quads: Quad[]): Promise<void> {
        await this.client.writeResource(identifier, quads);
    }
}
