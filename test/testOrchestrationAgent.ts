import {OrchestrationAgent as v1} from "../src/agent/OrchestrationAgentV1";
import {OpenHABActor} from "../src/openHAB/OpenHABActor";
import {OpenHABClient} from "../src/openHAB/OpenHABClient";
import {OpenHABRDFTranslator} from "../src/openHAB/OpenHABRDFTranslator";
import {SolidActor} from "../src/solid/SolidActor";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {SolidClient} from "../src/solid/SolidClient";
import {OrchestrationAgent as v2} from "../src/agent/OrchestrationAgentV2";
import {OrchestrationAgent as v3} from "../src/agent/OrchestrationAgentV3";
import {OrchestrationAgent as v2_5} from "../src/agent/OrchestrationAgentV2.5";
import {readText} from "koreografeye/dist/util";

require('dotenv').config()
// run solid server: community-solid-server -c memory-no-setup.json
// also openHAB service must be run: sudo systemctl start openhab.service
const openHABURL = process.env.OPENHAB_URL! + '/'
const openHABToken = process.env.OPENHAB_API_TOKEN!

const orchConfig = {
    item: "Bureau_rechts_Color",
    items: ['Bureau_rechts_Color'],
    openHABActor: new OpenHABActor(new OpenHABClient({
        accessToken: openHABToken,
        endPointUrl: openHABURL
    }), new OpenHABRDFTranslator()),
    solidStateResource: "http://localhost:3000/state", // need to setup a solid pod at port 3000 without config $ npx community-solid-server -c memory-no-setup.json
    solidActor: new SolidActor(new SolidClient(new Session()))
}

// version 1
async function main_v1() {
    const orchestrationAgent = new v1(orchConfig)
    await orchestrationAgent.initialise();
    orchestrationAgent.startSyncService()
}

// main_v1()

async function main_v2() {
    // $ curl -X PUT -H 'Content-type:text/turtle' -d "<Bureau_links_Color> <http://dbpedia.org/resource/Brightness> 0 .<Bureau_links_Color> <http://dbpedia.org/resource/Colorfulness> 0 .<Bureau_links_Color> <http://dbpedia.org/resource/Hue> 0 .<Bureau_links_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> .<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 100 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 15 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 0 .<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> ." http://localhost:3000/state
    const orchestrationAgent = new v2(orchConfig)
    await orchestrationAgent.initialise();
    orchestrationAgent.startSyncService()
    // // test stop functionality
    // await sleep(15000)
    // orchestrationAgent.stopService()
}

// main_v2()

async function main_v2_5() {
    // $ curl -X PUT -H 'Content-type:text/turtle' -d "<Bureau_links_Color> <http://dbpedia.org/resource/Brightness> 0 .<Bureau_links_Color> <http://dbpedia.org/resource/Colorfulness> 0 .<Bureau_links_Color> <http://dbpedia.org/resource/Hue> 0 .<Bureau_links_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> .<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 100 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 15 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 0 .<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> ." http://localhost:3000/state
    const config = {
        ...orchConfig, rules: [
            readText('./rules/openHABChangedRule.n3')!,
            readText('./rules/solidChangedRule.n3')!,
            readText('./rules/orchestratorToOpenHAB.n3')!,
            readText('./rules/orchestratorToSolid.n3')!,
            // readText('./rules/experimentalRule.n3')!,
        ]
    }
    const orchestrationAgent = new v2_5(config)
    await orchestrationAgent.initialise();
    orchestrationAgent.startSyncService()
    // // test stop functionality
    // await sleep(15000)
    // orchestrationAgent.stopService()
}

// main_v2_5()

async function main_v3() {
    // $ curl -X PUT -H 'Content-type:text/turtle' -d "<Bureau_links_Color> <http://dbpedia.org/resource/Brightness> 0 .<Bureau_links_Color> <http://dbpedia.org/resource/Colorfulness> 0 .<Bureau_links_Color> <http://dbpedia.org/resource/Hue> 0 .<Bureau_links_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> .<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 100 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 15 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 0 .<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> ." http://localhost:3000/state
    const config = {
        ...orchConfig, rules: [
            readText('./rules/openHABChangedRule.n3')!,
            readText('./rules/solidChangedRule.n3')!,
            readText('./rules/orchestratorToOpenHAB.n3')!,
            readText('./rules/orchestratorToSolid.n3')!,
            // readText('./rules/experimentalRule.n3')!,
        ]
    }
    const orchestrationAgent = new v3(config)
    await orchestrationAgent.initialise();
    orchestrationAgent.startSyncService()
    // // test stop functionality
    // await sleep(15000)
    // orchestrationAgent.stopService()
}

main_v3()

async function copy(){
    const config = {
        ...orchConfig, rules: [
            readText('./rules/orchestratorToSolid.n3')!,
            readText('./rules/experimentalRule.n3')!,
        ]
    }
    const orchestrationAgent = new v3(config)
    await orchestrationAgent.initialise();
    orchestrationAgent.startSyncService()
}
// copy()
