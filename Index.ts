import {SolidActor} from "./src/solid/Actor";
import {SolidClient} from "./src/solid/SolidClient";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {Writer} from "n3";
import {readText} from "koreografeye/dist/util";
import {OrchestrationActor} from "./src/agent/OrchestrationActor";
import {fnoHasStateChanged, fnoUpdateOpenHABState, fnoUpdateSolidState} from "./src/plugins/SmartHomeUseCase";
import {Actor, PluginFunction} from "./src/agent/OrchestrationActorInterface";
import {OpenHABClient} from "./src/openHAB/OpenHABClient";
import {OpenHABActor} from "./src/openHAB/Actor";
import {OpenHABRDFTranslator} from "./src/openHAB/OpenHABRDFTranslator";

const writer = new Writer()
require('dotenv').config()
// run solid server: community-solid-server -c memory-no-setup.json
// also openHAB service must be run: sudo systemctl start openhab.service
const openHABURL = process.env.OPENHAB_URL! + '/'
const openHABToken = process.env.OPENHAB_API_TOKEN!

const solidClient = new SolidClient(new Session())
const solidActor = new SolidActor(solidClient, {resources: ['http://localhost:3000/state']})

const openHABClient = new OpenHABClient({
    accessToken: openHABToken,
    endPointUrl: openHABURL
})
const openHABActor = new OpenHABActor(openHABClient, new OpenHABRDFTranslator(), {resources: ['Bureau_rechts_Color','Bureau_links_Color']})
const rules = [
    readText('./rules/openHABChangedRule.n3')!,
    readText('./rules/solidChangedRule.n3')!,
    readText('./rules/orchestratorToOpenHAB.n3')!,
    readText('./rules/orchestratorToSolid.n3')!,
    // readText('./rules/experimentalRule.n3')!,
]
const actors: Record<string, Actor> = {}
actors[solidActor.webID] = solidActor;
actors[openHABActor.webID] = openHABActor;

const plugins: Record<string, PluginFunction> = {
    'http://example.org/hasStateChanged': fnoHasStateChanged,
    'http://example.org/updateSolidState': fnoUpdateSolidState,
    'http://example.org/updateOpenHABState': fnoUpdateOpenHABState
}

const orchestraterActor = new OrchestrationActor({actors, plugins, rules})

async function main() {
    // init: sync state of solid pod with state of openHAB (start from state of openHAB)
    const state = await openHABActor.readResource('Bureau_rechts_Color')
    // if second light // TODO: fix with resources
    state.push(... await openHABActor.readResource('Bureau_links_Color'))
    await solidActor.writeResource('http://localhost:3000/state', state)
    await orchestraterActor.writeResource("state", state)
    // start
    orchestraterActor.start();
    // turn light on: $ curl -X PUT -H 'Content-type:text/turtle' -d "<Bureau_links_Color> <http://dbpedia.org/resource/Brightness> 10 .<Bureau_links_Color> <http://dbpedia.org/resource/Colorfulness> 50 .<Bureau_links_Color> <http://dbpedia.org/resource/Hue> 0 .<Bureau_links_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> .<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 10 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 60 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 272 .<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> ." http://localhost:3000/state
    // turn light off: $ curl -X PUT -H 'Content-type:text/turtle' -d "<Bureau_links_Color> <http://dbpedia.org/resource/Brightness> 0 .<Bureau_links_Color> <http://dbpedia.org/resource/Colorfulness> 50 .<Bureau_links_Color> <http://dbpedia.org/resource/Hue> 0 .<Bureau_links_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> .<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 0 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 60 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 272 .<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> ." http://localhost:3000/state
    console.log(writer.quadsToString(state))
}

main()

