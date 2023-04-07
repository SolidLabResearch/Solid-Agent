import {Readable, TransformCallback, Writable} from "stream";
import {Actor, PluginFunction} from "../OrchestrationActorInterface";
import {AS} from "@solid/community-server";

/**
 * Passes the incoming stream of events containing a payload, announcement, reasoning result and policy to the appropriate plugin functions.
 *
 * Currently, the plugins are based on the `fno:executes` property of the policy.
 * When no such plugins are found, nothing is executed.
 */
export class PolicyExecuteTransform extends Writable {
    private stream: Readable;
    private plugins: Record<string, PluginFunction>
    private actors: Record<string, Actor>

    constructor(stream: Readable, plugins: Record<string, PluginFunction>, actors: Record<string, Actor>) {
        super({objectMode: true})
        this.stream = stream;
        this.plugins = plugins;
        this.actors = actors
    }

    _write(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        if (chunk.policy === undefined) throw Error()

        const pluginIdentifier = chunk.policy.target
        const targetActorIdentifier = chunk.policy.args[AS.namespace + 'target']!.value // TODO: explain why this will always be in the target (reasoningResult -> Rules) | maybe just pass all the actors? discuss with patrick

        const plugin: PluginFunction = this.plugins[pluginIdentifier]
        const actor: Actor = this.actors[targetActorIdentifier]
        plugin(chunk, actor, {stream: this.stream})
        callback()
    }
}
