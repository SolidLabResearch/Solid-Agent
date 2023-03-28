import {SolidActor} from "./src/solid/Actor";
import {SolidClient} from "./src/solid/SolidClient";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {Writer} from "n3";
import {readText} from "koreografeye/dist/util";
import {OrchestrationActor} from "./src/agent/OrchestrationActor";
import {fnoHasStateChanged, fnoUpdateOpenHABState, fnoUpdateSolidState} from "./src/plugins/SmartHomeUseCase";
import {PluginFunction} from "./src/agent/OrchestrationActorInterface";
import {OpenHABClient} from "./src/openHAB/OpenHABClient";
import {OpenHABActor} from "./src/openHAB/Actor";
import {OpenHABRDFTranslator} from "./src/openHAB/OpenHABRDFTranslator";

const test: PluginFunction = async function (event, actor, optional): Promise<void> {
    if (event.policy === undefined) throw Error()
    console.log(`${new Date().toISOString()} Target function${event.policy.target}`)
}

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
const openHABActor = new OpenHABActor(openHABClient, new OpenHABRDFTranslator(), {resources: ['Bureau_rechts_Color']})
const writer = new Writer()
const rules = [
    readText('./rules/openHABChangedRule.n3')!,
    readText('./rules/solidChangedRule.n3')!,
    readText('./rules/orchestratorToOpenHAB.n3')!,
    readText('./rules/orchestratorToSolid.n3')!,
]
const actors = {
    'solid': solidActor,
    'openHAB': openHABActor
}
const plugins = {
    'http://example.org/hasStateChanged': fnoHasStateChanged,
    'http://example.org/updateSolidState': fnoUpdateSolidState,
    'http://example.org/updateOpenHABState': fnoUpdateOpenHABState
}

const orchestraterActor = new OrchestrationActor({actors, plugins, rules})

async function main() {
    // // test solid actor
    // const stream = new Readable({
    //     objectMode: true, read() {
    //     }
    // })
    // solidActor.monitorResources(stream)
    // stream.on('data', (event) => {
    //         console.log(writer.quadsToString(event.activity))
    //     }
    // )
    // init
    const state = await openHABActor.readResource('Bureau_rechts_Color')
    await solidActor.writeResource('http://localhost:3000/state',state)
    await orchestraterActor.writeResource("state", state)
    // start
    orchestraterActor.start();

}

main()

