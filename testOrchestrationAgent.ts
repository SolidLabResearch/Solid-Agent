import {OrchestrationAgent as v1, OrchestrationAgentInterface} from "./src/agent/OrchestrationAgentV1";
import {OpenHABActor} from "./src/openHAB/OpenHABActor";
import {OpenHABClient} from "./src/openHAB/OpenHABClient";
import {OpenHABRDFTranslator} from "./src/openHAB/OpenHABRDFTranslator";
import {SolidActor} from "./src/solid/SolidActor";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {SolidClient} from "./src/solid/SolidClient";
import {OrchestrationAgent as v2} from "./src/agent/OrchestrationAgentV2";

require('dotenv').config()
// community-solid-server -c memory-no-setup.json
// also openHAB service must be run
const openHABURL = process.env.OPENHAB_URL! + '/'
const openHABToken = process.env.OPENHAB_API_TOKEN!

const config: OrchestrationAgentInterface = {
    item: "Bureau_rechts_Color",
    openHABActor: new OpenHABActor(new OpenHABClient({
        accessToken: openHABToken,
        endPointUrl: openHABURL
    }), new OpenHABRDFTranslator()),
    solidStateResource: "http://localhost:3000/state", // need to setup a solid pod at port 3000 without config $ npx community-solid-server -c memory-no-setup.json
    solidActor: new SolidActor(new SolidClient(new Session()))
}
// version 1
async function main_v1(){
    const orchestrationAgent = new v1(config)
    await orchestrationAgent.initialise();
    orchestrationAgent.startSyncService()
}
// main_v1()

async function main_v2(){
    const orchestrationAgent = new v2(config)
    await orchestrationAgent.initialise();
    orchestrationAgent.startSyncService()
}
main_v2()
