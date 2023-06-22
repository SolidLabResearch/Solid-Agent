import {Actor, MessageClient, PluginFunction} from "../orchestration/OrchestrationActorInterface";
import {readText} from "koreografeye";
import path from "path";
import {SolidClient} from "../solid/SolidClient";
import {SolidActor} from "../solid/SolidActor";
import {OrchestrationActor} from "../orchestration/OrchestrationActor";
import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {SubscriptionEnum, SubscriptionType} from "../subscribe/SubscriptionTypes";
import {GeneralSubscriptionClient} from "../subscribe/GeneralSubscriptionClient";
import {SolidContainerNotificationClient} from "../subscribe/SolidContainerNotificationClient";
import {fnoCronPlugin} from "../plugins/CronPlugin";
import {fnoChangeAcl} from "../plugins/AclPlugin";

export class DemoUCPAgent {
    private actors: Record<string, Actor> = {};

    private rules = [
        readText(path.join(__dirname,'../../rules/usage-control/CronRule.n3'))!,

    ]

    private plugins: Record<string, PluginFunction> = {
        'http://example.org/cronJob': fnoCronPlugin,
        'http://example.org/changeAcl': fnoChangeAcl
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
        const solidWebID = config.solid.session?.info.webId ?? 'solid'

        // initialize solid actor: (one that can listen to new resources created in a container)
        this.solidClient = new SolidClient(session);
        this.solidSubscriptionClient = solidSubscriptionType?.type === SubscriptionEnum.PUSH ?
            new SolidContainerNotificationClient(session, this.solidClient, solidWebID) :
            new GeneralSubscriptionClient(this.solidClient, solidWebID, solidSubscriptionType?.interval); // Note: pull does not work yet
        this.solidActor = new SolidActor(this.solidClient, this.solidSubscriptionClient, {resources: solidResources, webID:solidWebID})

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
