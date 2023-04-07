import {Quad} from "n3";
import {IPolicyType} from "koreografeye/dist/util";
import {Reasoner} from "koreografeye";
import {Readable} from "stream";

export interface OrchestrationActorInterface {
    /**
     * An array of {@link https://www.w3.org/TeamSubmission/n3/|Notation3 (N3)} rules that are used by the {@link Reasoner}.
     */
    rules: string[]
    /**
     * A Key-Value store of the plugins that the orchestration actor can execute.
     * The Key is the identifier of the policy.
     * The Value is the plugin that is associated with the policy identifier.
     *
     * See {@link https://github.com/eyereasoner/Koreografeye|Koreografeye} for more information.
     */
    plugins: Record<string, PluginFunction>
    /**
     * A Key-Value store for the actors to which the orchestration actor can interact with.
     * The actors to which the orchestration actor can interact with.
     * The Key is the {@link https://solid.github.io/webid-profile/|Web ID} of the actor.
     * The Value is an actor (as defined in the README.md) that corresponds to the {@link https://solid.github.io/webid-profile/|Web ID}.
     */
    actors: Record<string, Actor>
}

/**
 * The interface that each plugin function must conform to.
 *
 * @param event - An {@link Event} for the plugin to act to.
 * @param actor - The {@link Actor} that will act.
 * @param optional -
 */
export type PluginFunction = (event: Event, actor: Actor, optional?: { stream?: Readable }) => Promise<void>;

export interface Event {
    /**
     * The {@link https://solid.github.io/webid-profile/|Web ID} of the actor that sent the activity.
     */
    from: string
    /**
     * The source locator of the resource payload of the activity.
     */
    resourceURL: string
    /**
     * An array of quads representing the raw data, stripped away from activity.
     */
    data: Quad[]
    /**
     * An array of quads representing the activity + payload (data).
     */
    activity?: Quad[]
    /**
     * An array of quads representing the reasoning result of rules executed on the activity.
     */
    reasoningResult?: Quad[]
    /**
     * An extracted policy based on the reasoning result.
     */
    policy?: IPolicyType
}

export interface Actor { // Note: maybe make an abstract class?
    /**
     * The {@link https://solid.github.io/webid-profile/|Web ID} of the actor.
     * The WebID Profile Document (obtained by derefencing the WebID) also contains a link
     * to the `ldp:inbox` of the actor where it receives {@link https://www.w3.org/TR/activitystreams-core/|AS2} activities.
     */
    webID: string;
    /**
     * The resources from the actor to which can be subscribed.
     */
    resources: string[];
    /**
     * Retrieve a resource using the actor. (RDF representation)
     * @param identifier - The location (URL) of the resource.
     */
    readResource: (identifier: string) => Promise<Quad[]>
    /**
     * Write a resource to a location using the actor.
     * @param identifier - The location (URL) of the resource.
     * @param data - The content of the resource (in RDF).
     */
    writeResource: (identifier: string, data: Quad[]) => Promise<void>
    /**
     * Subscribe to a resource.
     * @param identifier - The location (URL) of the resource.
     * @param stream - (optional) a stream to which updates can be pushed.
     */
    monitorResource: (identifier: string, stream?: Readable) => Promise<void>
    /**
     * Subscribe the resources which are configured within the actor.
     * @param stream - (optional) a stream to which updates can be pushed.
     */
    monitorResources: (stream?: Readable) => Promise<void>
    // TODO: add functionality to stop monitoring resources
}

/**
 * An interface that doesn't care about which messaging strategy (push/pull-based) is used in the implementation.
 * It uses subscribe to listen to a resource and close to stop listening to all resources.
 */
export interface MessageClient {
    /**
     * Subscribe to a resource.
     * @param identifier
     */
    subscribe: (identifier: string) => Promise<Readable>;
    /**
     * Close all subscriptions.
     */
    close: () => void
}

/**
 * An Interface that provides Read and Write functionality to the external resource (platform).
 *
 */
export interface ReadWriteClient {
    readResource: (identifier: string) => Promise<unknown>;
    writeResource: (identifier: string, data:unknown) => Promise<void>;

}

