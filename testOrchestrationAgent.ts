import {OrchestrationAgent, OrchestrationAgentInterface} from "./src/agent/OrchestrationAgentV1";
import {OpenHABActor} from "./src/openHAB/OpenHABActor";
import {OpenHABClient} from "./src/openHAB/OpenHABClient";
import {OpenHABRDFTranslator} from "./src/openHAB/OpenHABRDFTranslator";
import {SolidActor} from "./src/solid/SolidActor";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {SolidClient} from "./src/solid/SolidClient";

require('dotenv').config()

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
const orchestrationAgent = new OrchestrationAgent(config)

async function main(){
    await orchestrationAgent.initialise();
    orchestrationAgent.startSyncService()
}
main()
