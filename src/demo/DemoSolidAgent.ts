import {readText} from "koreografeye";
import {SolidClient} from "../solid/SolidClient";
import {GeneralSubscriptionClient} from "../subscribe/GeneralSubscriptionClient";
import {SolidActor} from "../solid/SolidActor";
import {OpenHABClient} from "../openHAB/OpenHABClient";
import {OpenHABActor} from "../openHAB/OpenHabActor";
import {OrchestrationActor} from "../orchestration/OrchestrationActor";
import {Actor, MessageClient, PluginFunction} from "../orchestration/OrchestrationActorInterface";
import {fnoHasStateChanged, fnoUpdateOpenHABState, fnoUpdateSolidState} from "../plugins/SmartHomeUseCase";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {OpenHABRDFTranslator} from "../openHAB/OpenHABRDFTranslator";
import {SolidNotificationClient} from "../subscribe/SolidNotificationClient";
import {Quad} from "n3";
import * as path from 'path';

export enum SubscriptionEnum {
    PUSH = 'push',
    PULL = 'pull'
}

export type SubscriptionType = {
    type: SubscriptionEnum
    interval?: number // (ms)
}

export class DemoSolidAgent {
    // TODO: merge code to main + add to npm when koreografeye is fixed

    private actors: Record<string, Actor> = {};

    private plugins: Record<string, PluginFunction> = {
        'http://example.org/hasStateChanged': fnoHasStateChanged,
        'http://example.org/updateSolidState': fnoUpdateSolidState,
        'http://example.org/updateOpenHABState': fnoUpdateOpenHABState
    };

    private rules = [
        readText(path.join(__dirname,'./rules/openHABChangedRule.n3'))!,
        readText(path.join(__dirname,'./rules/solidChangedRule.n3'))!,
        readText(path.join(__dirname,'./rules/orchestratorToOpenHAB.n3'))!,
        readText(path.join(__dirname,'./rules/orchestratorToSolid.n3'))!,
    ];

    private solidClient: SolidClient;
    private solidSubscriptionClient: MessageClient;
    private solidActor: SolidActor;

    private openHABClient: OpenHABClient;
    private openHABSubscriptionClient: MessageClient;
    private openHABTranslator: OpenHABRDFTranslator;
    private openHABActor: OpenHABActor;

    private orchestrationActor: OrchestrationActor;

    private solidStateResource: string;
    public constructor(config: {
        openhab: {
            openHABToken: string,
            openHABURL: string,
            openHABResources: string[],
            subscriptionType?: SubscriptionType
        }
        solid: {
            solidResources: string[],
            session?: Session,
            subscriptionType?: SubscriptionType
        }
    }) {
        // destructuring
        const {openHABToken, openHABURL, openHABResources, subscriptionType: openHABSubscriptionType} = config.openhab;
        const {solidResources, subscriptionType: solidSubscriptionType} = config.solid
        const session = config.solid.session ?? new Session()
        const solidWebID = 'solid'
        const openHABWebID = 'openHAB'
        const orchestratorWebID = 'orchestrator'

        // initialize openHAB actor
        this.openHABClient = new OpenHABClient({accessToken: openHABToken, endPointUrl: openHABURL});
        this.openHABSubscriptionClient = new GeneralSubscriptionClient(this.openHABClient, openHABWebID, openHABSubscriptionType?.interval);
        this.openHABTranslator = new OpenHABRDFTranslator()
        this.openHABActor = new OpenHABActor(this.openHABClient, this.openHABSubscriptionClient, this.openHABTranslator, {
            resources: openHABResources,
            webID: openHABWebID
        })

        // initialize solid actor
        this.solidClient = new SolidClient(session);
        this.solidSubscriptionClient = solidSubscriptionType?.type === SubscriptionEnum.PUSH ?
            new SolidNotificationClient(session, this.solidClient, solidWebID) :
            new GeneralSubscriptionClient(this.solidClient, solidWebID, solidSubscriptionType?.interval);
        this.solidActor = new SolidActor(this.solidClient, this.solidSubscriptionClient, {resources: solidResources})

        // initialize orchestrationActor
        this.actors[solidWebID] = this.solidActor;
        this.actors[openHABWebID] = this.openHABActor;

        this.orchestrationActor = new OrchestrationActor({
            actors: this.actors,
            plugins: this.plugins,
            rules: this.rules
        })

        this.solidStateResource = solidResources[0];
    }

    public async start() {
        // sync state of solid pod with state of openHAB (start from state of openHAB)
        const state: Quad[] = []
        for (const resource of this.openHABActor.resources) {
            state.push(...await this.openHABActor.readResource(resource))
        }
        await this.solidActor.writeResource(this.solidStateResource, state)
        await this.orchestrationActor.writeResource("state", state)

        // start
        this.orchestrationActor.start();
    }

}


