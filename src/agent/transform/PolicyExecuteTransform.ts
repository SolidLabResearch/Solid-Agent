import {Readable, TransformCallback, Writable} from "stream";
import {PluginFunction} from "../OrchestrationActorInterface";

/**
 * Passes the incoming stream of events containing a payload, announcement, reasoning result and policy to the appropriate plugin functions.
 *
 * Currently, the plugins are based on the `fno:executes` property of the policy.
 * When no such plugins are found, nothing is executed.
 */
export class PolicyExecuteTransform extends Writable {
    private stream: Readable;
    private plugins: Record<string, PluginFunction>

    constructor(stream: Readable, plugins: Record<string, PluginFunction>) {
        super({objectMode: true})
        this.stream = stream;
        this.plugins = plugins;
    }

    _write(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        const pluginIdentifier = chunk.policy.target
        const plugin: PluginFunction = this.plugins[pluginIdentifier]
        // plugin(chunck, actor, {})
// Note: How the fuck do I get to the actor and optionals?
        callback()
    }
}
