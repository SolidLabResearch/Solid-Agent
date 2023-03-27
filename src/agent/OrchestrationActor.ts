import {Actor, Event, OrchestrationActorInterface, PluginFunction} from "./OrchestrationActorInterface";
import {Readable} from "stream";
import {Quad} from "n3";
import {ReasoningTransform} from "./transform/ReasoningTransform";
import {PolicyExtractTransform} from "./transform/PolicyExtractTransform";
import {AS} from "@solid/community-server";

export class OrchestrationActor implements Actor {
    private actors: Record<string, Actor>;
    private plugins: Record<string, PluginFunction>;
    private rules: string[];
    private state: Quad[];
    private stream: Readable;

    private running = false;

    public constructor(config: OrchestrationActorInterface) {
        this.actors = config.actors;
        this.plugins = config.plugins;
        this.rules = config.rules;
        this.state = []
        this.stream = new Readable({
            objectMode: true,
            read() {
            }
        })
    }

    monitorResource(identifier: string, stream: Readable | undefined): Promise<void> {
        return Promise.resolve(undefined);
    }

    monitorResources(stream: Readable | undefined): Promise<void> {
        return Promise.resolve(undefined);
    }

    readResource(identifier: string): Promise<Quad[]> {
        return Promise.resolve([]);
    }


    writeResource(identifier: string, data: Quad[]): Promise<void> {
        return Promise.resolve(undefined);
    }

    public start() {
        if (this.running) return
        this.initStream();

        this.running = false;
        for (const actor of Object.values(this.actors)) {
            actor.monitorResources(this.stream)
        }

        const reasonerTransform = new ReasoningTransform(this.rules);
        const policyExtractTransform = new PolicyExtractTransform()
        // const policyExecuteTransform = new PolicyExecuteTransform(stream, this.policies)

        const extractedPolicesStream = this.stream
            .pipe(reasonerTransform)
            .pipe(policyExtractTransform)
        // .pipe(policyExecuteTransform)

        // Listen to stream and execute policies? TODO: check if can be placed in {@link PolicyExecuteTransform}
        const agent = this
        extractedPolicesStream.on('data', (event: Event) => {
            if (event.policy === undefined) throw Error()
            const pluginIdentifier = event.policy.target
            const targetActorIdentifier = event.policy.args[AS.namespace + 'target']!.value // TODO: explain why this will always be in the target (reasoningResult -> Rules)

            const plugin: PluginFunction = agent.plugins[pluginIdentifier]
            const actor: Actor = agent.actors[targetActorIdentifier]
            plugin(event, actor, {state: agent.state, stream: agent.stream})
        })
    }

    public stop() {
        this.running = false
        this.stopStream();

    }

    private initStream() {
        if (this.running) return
        // Maybe look into a typed stream? https://stackoverflow.com/questions/52826503/typescript-is-there-a-better-way-to-get-typed-streams
        // Other way -> extend eventEmitter like @rdfjs/types Stream.RDF does it?
        this.stream = new Readable({
            objectMode: true,
            read() {
            }
        })
    }

    private stopStream() {
        if (!this.running) return
        this.stream.destroy();
    }
}
