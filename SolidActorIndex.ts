import {SolidClient} from "./src/solid/SolidClient";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {Readable} from "stream";
import {Quad, Writer} from "n3";
import {SolidNotificationClient} from "./src/subscribe/SolidNotificationClient";
import {OpenHABClient} from "./src/openHAB/OpenHABClient";
import {GeneralSubscriptionClient} from "./src/subscribe/GeneralSubscriptionClient";
import {OpenHABRDFTranslator} from "./src/openHAB/OpenHABRDFTranslator";
import {Actor, PluginFunction} from "./src/orchestration/OrchestrationActorInterface";
import {fnoHasStateChanged, fnoUpdateOpenHABState, fnoUpdateSolidState} from "./src/plugins/SmartHomeUseCase";
import {OrchestrationActor} from "./src/orchestration/OrchestrationActor";
import {readText} from "koreografeye";
import {SolidActor} from "./src/solid/SolidActor";
import {OpenHABActor} from "./src/openHAB/OpenHabActor";
import {DemoSolidAgent} from "./src/demo/DemoSolidAgent";
import {SubscriptionEnum} from "./src/subscribe/SubscriptionTypes";
import {DemoSyncAgent} from "./src";

// CSS start command (use V6): community-solid-server -c @css:config/file-no-setup.json -f ./.data

const writer = new Writer()
require('dotenv').config()
// openhab actor
const openHABURL = process.env.OPENHAB_URL! + '/'
const openHABToken = process.env.OPENHAB_API_TOKEN!

const openHABClient = new OpenHABClient({
    accessToken: openHABToken,
    endPointUrl: openHABURL
})
const openHABSubscriptionClient = new GeneralSubscriptionClient(openHABClient, 'openHAB')
const openHABActor = new OpenHABActor(openHABClient, openHABSubscriptionClient, new OpenHABRDFTranslator(), {resources: ['Bureau_rechts_Color', 'Bureau_links_Color']})

// solid actor
const session = new Session()

const solidClient = new SolidClient(session)

// const subscriptionClient  = new GeneralSubscriptionClient(solidClient, 'solid', 10000);
const subscriptionClient = new SolidNotificationClient(session, solidClient, 'solid')

const solidActor = new SolidActor(solidClient, subscriptionClient, {resources: ['http://localhost:3000/state']})

// orchestrator actor
const actors: Record<string, Actor> = {}
actors[solidActor.webID] = solidActor;
actors[openHABActor.webID] = openHABActor;

const plugins: Record<string, PluginFunction> = {
    'http://example.org/hasStateChanged': fnoHasStateChanged,
    'http://example.org/updateSolidState': fnoUpdateSolidState,
    'http://example.org/updateOpenHABState': fnoUpdateOpenHABState
}

const rules = [
    readText('./rules/openHABChangedRule.n3')!,
    readText('./rules/solidChangedRule.n3')!,
    readText('./rules/orchestratorToOpenHAB.n3')!,
    readText('./rules/orchestratorToSolid.n3')!,
    // readText('./rules/experimentalRule.n3')!,
]
const orchestraterActor = new OrchestrationActor({actors, plugins, rules})

async function solidSubscription() {
    const session = new Session()

    const solidClient = new SolidClient(session)

    // const subscriptionClient  = new GeneralSubscriptionClient(solidClient, 'solid', 10000);
    const subscriptionClient = new SolidNotificationClient(session, solidClient, 'solid')

    const solidActor = new SolidActor(solidClient, subscriptionClient, {resources: ['http://localhost:3000/state']})
    const stream = new Readable({
        objectMode: true,
        read() {
        }
    })
    solidActor.monitorResources(stream)
    stream.on('data', event => {
        console.log(`${new Date().toISOString()} Received event from ${event.from} actor.`)
        console.log(new Writer().quadsToString(event.activity))
    })
}

// solidSubscription()

async function openHABSubscription() {
    const openHABURL = process.env.OPENHAB_URL! + '/'
    const openHABToken = process.env.OPENHAB_API_TOKEN!

    const openHABClient = new OpenHABClient({
        accessToken: openHABToken,
        endPointUrl: openHABURL
    })
    const openHABSubscriptionClient = new GeneralSubscriptionClient(openHABClient, 'openHAB')
    const openHABActor = new OpenHABActor(openHABClient, openHABSubscriptionClient, new OpenHABRDFTranslator(), {resources: ['Bureau_rechts_Color', 'Bureau_links_Color']})
    const stream = new Readable({
        objectMode: true,
        read() {
        }
    })
    openHABActor.monitorResources(stream)
    stream.on('data', event => {
        console.log(`${new Date().toISOString()} Received event from ${event.from} actor.`)
        console.log(new Writer().quadsToString(event.data))
    })
}

// openHABSubscription()
// TODO: test out in office

async function main() {
    // init: sync state of solid pod with state of openHAB (start from state of openHAB)
    const state: Quad[] = []
    for (const resource of openHABActor.resources) {
        state.push(...await openHABActor.readResource(resource))
    }
    await solidActor.writeResource('http://localhost:3000/state', state)
    await orchestraterActor.writeResource("state", state)
    // start
    orchestraterActor.start();
    // turn light on:
    // curl -X PUT -H 'Content-type:text/turtle' -d "<Bureau_links_Color> <http://dbpedia.org/resource/Brightness> 10 .<Bureau_links_Color> <http://dbpedia.org/resource/Colorfulness> 50 .<Bureau_links_Color> <http://dbpedia.org/resource/Hue> 0 .<Bureau_links_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> .<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 10 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 60 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 272 .<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> ." http://localhost:3000/state
    // turn light off:
    // curl -X PUT -H 'Content-type:text/turtle' -d "<Bureau_links_Color> <http://dbpedia.org/resource/Brightness> 0 .<Bureau_links_Color> <http://dbpedia.org/resource/Colorfulness> 50 .<Bureau_links_Color> <http://dbpedia.org/resource/Hue> 0 .<Bureau_links_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> .<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 0 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 60 .<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 272 .<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> ." http://localhost:3000/state
    console.log(writer.quadsToString(state))
}

// main()

async function demo() {
    const openHABURL = process.env.OPENHAB_URL! + '/'
    const openHABToken = process.env.OPENHAB_API_TOKEN!
    const demo = new DemoSolidAgent({
        openhab: {
            openHABResources: ['Bureau_rechts_Color', 'Bureau_links_Color'],
            openHABToken: openHABToken,
            openHABURL: openHABURL
        },
        solid: {
            solidResources: ['http://localhost:3000/state'],
            subscriptionType: {type: SubscriptionEnum.PUSH}
        }
    })
    await demo.start()
}

demo()

async function demoHomeLab() {
    // Note: vpn must be on
    const openHABURL = process.env.OPENHAB_HOMELAB_URL! + '/'
    const openHABToken = process.env.OPENHAB_HOMELAB_API_TOKEN!
    const demo = new DemoSolidAgent({
        openhab: {
            openHABResources: ['Alllights_Color'],
            openHABToken: openHABToken,
            openHABURL: openHABURL
        },
        solid: {
            solidResources: ['http://localhost:3000/homeLabState'],
            subscriptionType: {type: SubscriptionEnum.PUSH}
        }
    })
    // turn light on: (color purple hue 270)
    // curl -X PUT -H 'Content-type:text/turtle' -d "<Alllights_Color> <http://dbpedia.org/resource/Brightness> 40 .<Alllights_Color> <http://dbpedia.org/resource/Colorfulness> 50 .<Alllights_Color> <http://dbpedia.org/resource/Hue> 0 .<Alllights_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> ." http://localhost:3000/homeLabState
    // turn light off:
    // curl -X PUT -H 'Content-type:text/turtle' -d "<Alllights_Color> <http://dbpedia.org/resource/Brightness> 0 .<Alllights_Color> <http://dbpedia.org/resource/Colorfulness> 50 .<Alllights_Color> <http://dbpedia.org/resource/Hue> 0 .<Alllights_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> ." http://localhost:3000/homeLabState

    await demo.start()
}

// demoHomeLab()

async function demoSync() {

    const demo = new DemoSyncAgent({
        solid: {
            solidResources: ['http://localhost:3000/state'],
            subscriptionType: {type: SubscriptionEnum.PUSH}
        }
    })
    await demo.start()
}
// demoSync()
