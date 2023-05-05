import {readText} from "koreografeye";
import * as path from 'path';
import {Actor, MessageClient, PluginFunction} from "../orchestration/OrchestrationActorInterface";
import {fnoUpdateSolidState} from "../plugins/SmartHomeUseCase";
import {SolidClient} from "../solid/SolidClient";
import {SolidActor} from "../solid/SolidActor";
import {SubscriptionEnum, SubscriptionType} from "../subscribe/SubscriptionTypes";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {SolidNotificationClient} from "../subscribe/SolidNotificationClient";
import {GeneralSubscriptionClient} from "../subscribe/GeneralSubscriptionClient";
import {OrchestrationActor} from "../orchestration/OrchestrationActor";


export class DemoSyncAgent {
    private actors: Record<string, Actor> = {};

    private rules = [
        readText(path.join(__dirname,'../../rules/experimentalRule.n3'))!,

    ]

    private plugins: Record<string, PluginFunction> = {
        'http://example.org/updateSolidState': fnoUpdateSolidState,
    };

    private solidClient: SolidClient;
    private solidSubscriptionClient: MessageClient;
    private solidActor: SolidActor;

    private orchestrationActor: OrchestrationActor;

    public constructor(config: {
        solid: {
            solidResources: string[],
            session?: Session,
            subscriptionType?: SubscriptionType
        }
    }) {
        const {solidResources, subscriptionType: solidSubscriptionType} = config.solid
        const session = config.solid.session ?? new Session()
        const solidWebID = 'solid'

        // initialize solid actor
        this.solidClient = new SolidClient(session);
        this.solidSubscriptionClient = solidSubscriptionType?.type === SubscriptionEnum.PUSH ?
            new SolidNotificationClient(session, this.solidClient, solidWebID) :
            new GeneralSubscriptionClient(this.solidClient, solidWebID, solidSubscriptionType?.interval);
        this.solidActor = new SolidActor(this.solidClient, this.solidSubscriptionClient, {resources: solidResources})

        // initialize orchestrationActor
        this.actors[solidWebID] = this.solidActor;

        this.orchestrationActor = new OrchestrationActor({
            actors: this.actors,
            plugins: this.plugins,
            rules: this.rules
        })
    }

    public async start() {
        // start
        this.orchestrationActor.start();
    }
}
