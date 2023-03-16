import {OpenHABActor} from "../openHAB/OpenHABActor";
import {SolidActor} from "../solid/SolidActor";
import {Quad, Writer} from "n3";
import {isomorphic} from "rdf-isomorphic";
import {sleep} from "@treecg/versionawareldesinldp";

export interface OrchestrationAgentInterface {
    openHABActor: OpenHABActor
    solidActor: SolidActor,
    solidStateResource: string
    // version one only works with one item
    item: string
}

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
        while (this.running) {
            // get state solid pod
            const solidState = await this.solidActor.readResource(this.solidStateResource)
            // get item from openHAB
            const itemOpenHABState = await this.openHABActor.retrieveItem(this.item)

            const changedSolid = !isomorphic(solidState, this.state)
            const changedItemOpenHAB = !isomorphic(itemOpenHABState, this.state)

            // written so solid pod has precedence over lamp for some reason -> something needs precedence, otherwise you'll get a loop
            if (changedSolid && changedItemOpenHAB) {
                this.state = solidState
                await this.openHABActor.storeItem(solidState)
                console.log('updating openHAB')
            } else if (changedItemOpenHAB) {
                this.state = itemOpenHABState
                await this.solidActor.writeResource(this.solidStateResource, itemOpenHABState)
                console.log('updating solid state')
            } else if (changedSolid) {
                console.log('updating openHAB')
                console.log('current solid state: ' +new Writer().quadsToString(solidState))
                console.log('current orchestrator state: ' +new Writer().quadsToString(this.state))
                this.state = solidState
                await this.openHABActor.storeItem(solidState)
            } else {
                console.log('nothing changed: wait till next cycle')
            }
            await sleep(10000)
        }
    }

    public async stopService() {
        this.running = false;
    }
}

