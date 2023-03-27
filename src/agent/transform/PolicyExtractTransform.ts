import {Transform, TransformCallback} from "stream";
import {extractPolicies} from "koreografeye/dist/policy/Extractor";
import {Store} from "n3";
import {getLogger} from "log4js";

/**
 * Transforms the incoming stream of events containing a payload, announcement and reasoning result
 * to a stream of events containing a policy and the same payload, announcement and reasoning result.
 *
 * The Policies are extracted by using an algorithm ({@link extractPolicies}) defined by {@link https://github.com/eyereasoner/Koreografeye|Koreografeye}.
 */
export class PolicyExtractTransform extends Transform {
    constructor() {
        super({objectMode: true});
    }

    async _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        const extractedPolicies = await extractPolicies(new Store(chunk.reasoningResult), 'no_idea', {}, getLogger())
        const policies = Object.values(extractedPolicies)
        for (const policy of policies) {
            chunk.policy = policy
            this.push(chunk)
        }
        callback()
    }
}
