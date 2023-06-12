import {Transform, TransformCallback} from "stream";
import {EyeJsReasoner, Reasoner} from "koreografeye";
import {Store, Writer} from "n3";
import {storeToString, turtleStringToStore} from "../../Util";

/**
 * Transforms the incoming Announcement stream to a stream now containing an additional property "reasoningResult"
 * This result is obtained by executing the Eye reasoner on the announcement data from an incoming chunk.
 *
 * Further regex is applied due to eye adding `file:///` to each relative URI.
 * Ask Jos De Roo <jos.deroo@ugent.be> for more information about why this is happening.
 */
export class ReasoningTransform extends Transform {
    private rules: string[];
    private reasoner: Reasoner;
    constructor(rules: string[]) {
        super({objectMode: true})
        this.rules = rules;
        this.reasoner = new EyeJsReasoner([
            "--quiet",
            "--nope",
            "--pass"
        ])
    }

    async _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        const announcementStore = new Store(chunk.activity)
        const result = await this.reasoner.reason(announcementStore, this.rules)
        const resultString = storeToString(result)
        const cleaned = resultString.replace(/file:\/\/\//g, "")
        const cleanedStore = await turtleStringToStore(cleaned)
        chunk.reasoningResult = cleanedStore.getQuads(null, null, null, null)
        console.log(new Writer().quadsToString(cleanedStore.getQuads(null, null, null, null)))
        callback(null, chunk)
    }
}
