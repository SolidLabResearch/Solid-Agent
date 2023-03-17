import {OpenHABActor} from "../openHAB/OpenHABActor";
import {SolidActor} from "../solid/SolidActor";
import {Quad, Writer} from "n3";
import {isomorphic} from "rdf-isomorphic";
import {sleep} from "@treecg/versionawareldesinldp";
import {Readable} from "stream";

export interface OrchestrationAgentInterface {
    openHABActor: OpenHABActor
    solidActor: SolidActor,
    solidStateResource: string
    // version one only works with one item
    item: string
}

// This version monitors the components for changes
// updates are pushed to a stream
export class OrchestrationAgent {
    private readonly openHABActor: OpenHABActor;
    private readonly solidActor: SolidActor;
    private readonly item: string;
    private readonly solidStateResource: string;

    private state: Quad[];
    private running = false;

    constructor(config: OrchestrationAgentInterface) {
        this.solidActor = config.solidActor
        this.openHABActor = config.openHABActor
        this.solidStateResource = config.solidStateResource
        this.item = config.item
        this.state = []
    }

    public async initialise() {
        // read all items
        const itemQuads = await this.openHABActor.retrieveItem(this.item)
        // store them all to the state resource on the solid pod
        await this.solidActor.writeResource(this.solidStateResource, itemQuads)
        // store them all to the internal state
        this.state = itemQuads
        console.log('initialised')
    }

    public async startSyncService() {
        this.running = true
        const stream = new Readable({
            objectMode: true,
            read() {}
        })

        this.solidActor.monitorResource(this.solidStateResource, stream);
        this.openHABActor.monitorItem(this.item, stream);

        stream.on('data', event => {
            let changed = false
            switch (event.from){
                case 'solid':
                    changed = !isomorphic(event.data, this.state)
                    if (changed) {
                        console.log(`[${new Date().toISOString()}] Received event from ${event.from} actor: start updating state in openhab.`)
                        this.state = event.data;
                        this.openHABActor.storeItem(event.data)
                    } else {
                        console.log(`[${new Date().toISOString()}] Received event from ${event.from} actor: No change detected.`)
                    }
                    break;
                case 'openHAB':
                    changed = !isomorphic(event.data, this.state)
                    if (changed) {
                        console.log(`[${new Date().toISOString()}] Received event from ${event.from} actor: start updating state in solid.`)
                        this.state = event.data;
                        this.solidActor.writeResource(this.solidStateResource, event.data)
                    } else {
                        console.log(`[${new Date().toISOString()}] Received event from ${event.from} actor: No change detected.`)
                    }
                    break;
                default:
            }
        })

    }

    public async stopService() {
        this.running = false;
    }
}

