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

export type PluginFunction = (event: Event, actor: Actor, optional?: {state?: Quad[], stream?: Readable}) => Promise<void>;

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

export interface Actor {
    readResource: (identifier: string) => Promise<Quad[]>
    writeResource: (identifier: string, data: Quad[]) => Promise<void>
    monitorResource: (identifier: string, stream?: Readable) => Promise<void>
    monitorResources: (stream?: Readable) => Promise<void>
}
