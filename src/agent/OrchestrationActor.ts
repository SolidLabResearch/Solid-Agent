import {Actor, OrchestrationActorInterface, PluginFunction} from "./OrchestrationActorInterface";
import {Readable} from "stream";
import {Quad} from "n3";
import {ReasoningTransform} from "./transform/ReasoningTransform";
import {PolicyExtractTransform} from "./transform/PolicyExtractTransform";
import {PolicyExecuteTransform} from "./transform/PolicyExecuteTransform";

export class OrchestrationActor implements Actor {
    private actors: Record<string, Actor>;
    private plugins: Record<string, PluginFunction>;
    private _resources: Record<string, Quad[]>
    private rules: string[];
    private stream: Readable;

    private running = false;
    private _webID = 'orchestrator' // TODO: proper configure own actor with webid

    public constructor(config: OrchestrationActorInterface) {
        this.actors = config.actors;
        this.plugins = config.plugins;
        this.rules = config.rules;
        this._resources = {};
        this.stream = new Readable({
            objectMode: true,
            read() {
            }
        })
        this.actors[this.webID] = this
    }

    get resources(): string[] {
        return Object.keys(this._resources)
    }

    get webID(): string {
        return this._webID
    }

    monitorResource(identifier: string, stream: Readable | undefined): Promise<void> {
        return Promise.resolve(undefined);
    }

    monitorResources(stream: Readable | undefined): Promise<void> {
        return Promise.resolve(undefined);
    }

    async readResource(identifier: string): Promise<Quad[]> {
        const resource = this._resources[identifier]
        if (!resource) throw Error(`${this.constructor.name} does not have a resource with identifier ${identifier}`)
        return resource
    }


    async writeResource(identifier: string, data: Quad[]): Promise<void> {
        this._resources[identifier] = data;
        // const writer = new Writer();
        // console.log('before', writer.quadsToString(this.resources[identifier] ?? []))
        // console.log('after', writer.quadsToString(data))
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
        const policyExecuteTransform = new PolicyExecuteTransform(this.stream, this.plugins, this.actors)

        this.stream
            .pipe(reasonerTransform)
            .pipe(policyExtractTransform)
            .pipe(policyExecuteTransform)
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
