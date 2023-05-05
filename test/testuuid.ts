import {EyeJsReasoner, EyeReasoner, readText} from "koreografeye";
import * as path from "path";

async function run() {
    const reasoner = new EyeJsReasoner([
        "--quiet" ,
        "--nope" ,
        "--pass"
    ])
    const result = await reasoner.run(['<urn:test> <urn:lol> <urn:kaka> .'],[readText(path.join(__dirname, '../', 'rules','generate_uuid.n3'))!])

    const regexApplied = result.replace(/file:\/\/\//g,"")
    console.log(regexApplied)

    const eyeReasoner = new EyeReasoner('eye',[
        "--quiet" ,
        "--nope" ,
        "--pass"
    ])

    const eyeResult = await eyeReasoner.run(['<urn:test> <urn:lol> <urn:kaka> .'],[readText(path.join(__dirname, '../', 'rules','generate_uuid.n3'))!])

    const eyeRegexApplied = eyeResult.replace(/file:\/\/\//g,"")
    console.log(eyeRegexApplied)
}
run()
