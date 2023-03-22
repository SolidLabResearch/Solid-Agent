import {OpenHABActor} from "../openHAB/OpenHABActor";
import {SolidActor} from "../solid/SolidActor";
import {DataFactory, Quad} from "n3";
import {Readable} from "stream";
import {extractItem, hasChanged, updateState} from "./Util";

export interface OrchestrationAgentInterface {
    openHABActor: OpenHABActor
    solidActor: SolidActor,
    solidStateResource: string
    items: string[]
}

// This version monitors the components for changes
// updates are pushed to a stream
// handles multiple items
export class OrchestrationAgent {
    private readonly openHABActor: OpenHABActor;
    private readonly solidActor: SolidActor;
    private readonly items: string[];
    private readonly solidStateResource: string;

    private state: Quad[];
    private running = false;

    constructor(config: OrchestrationAgentInterface) {
        this.solidActor = config.solidActor
        this.openHABActor = config.openHABActor
        this.solidStateResource = config.solidStateResource
        this.items = config.items
        this.state = []
    }

    public async initialise() {
        // read all items
        const state = []
        for (const item of this.items) {
            const itemQuads = await this.openHABActor.retrieveItem(item)
            state.push(...itemQuads)
        }
        // store them all to the state resource on the solid pod
        await this.solidActor.writeResource(this.solidStateResource, state)
        // store them all to the internal state
        this.state = state
        console.log(`${new Date().toISOString()} [${this.constructor.name}] Succesfully initialised ${this.items.length} items.`)
    }

    public async startSyncService() {
        this.running = true
        const stream = new Readable({
            objectMode: true,
            read() {
            }
        })

        this.solidActor.monitorResource(this.solidStateResource, stream);
        this.openHABActor.monitorItems(this.items, stream);

        stream.on('data', event => {
            let updatedState = []
            switch (event.from) {
                case 'solid':
                    updatedState = updateState(this.state, event.data)
                    // Note: Does not work when the relative identifier gets updated to fixed one.
                    //  e.g. <http://localhost:3000/Bureau_rechts_Color> instead of <Bureau_rechts_Color>
                    //  can be solved by adding some prefix extracting item functionality
                    if (hasChanged(updatedState, this.state)) {
                        console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: start updating state in openhab.`)
                        this.state = updatedState;
                        for (const item of this.items) {
                            const itemQuads = extractItem(updatedState, item);
                            this.openHABActor.storeItem(itemQuads)
                        }
                    } else {
                        console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: No change detected.`)
                    }
                    break;
                case 'openHAB':
                    updatedState = updateState(this.state, event.data);
                    if (hasChanged(updatedState, this.state)) {
                        console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: start updating state in solid.`)
                        this.state = updatedState;
                        this.solidActor.writeResource(this.solidStateResource, updatedState)
                    } else {
                        console.log(`${new Date().toISOString()} [${this.constructor.name}] Received event from ${event.from} actor: No change detected.`)
                    }
                    break;
                default:
            }
        })

    }

    public stopService() {
        this.solidActor.stopMonitoring();
        this.openHABActor.stopMonitoring();
        this.running = false;
    }
}
