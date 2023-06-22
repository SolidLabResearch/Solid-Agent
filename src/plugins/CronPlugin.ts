import {Event, PluginFunction} from "../orchestration/OrchestrationActorInterface";
import {CronJob} from "cron";
import {DataFactory, Literal, Store} from "n3";
import {extractDateFromLiteral} from "../util/TimeStampUtil";
import {AS} from "../Vocabulary";
import {generate_uuid} from "koreografeye";
import namedNode = DataFactory.namedNode;

// Forms a new policy which is put on the stream (send back to orch)
// How should it work for KoreoGrafeye? | discuss later with Patrick
export const fnoCronPlugin: PluginFunction = async function (event, actor, optional): Promise<void> {
    if (event.policy === undefined) throw Error()
    if (optional === undefined) throw Error()
    if (optional.stream === undefined) throw Error()

    const stream = optional.stream;

    const timeToFireTerm = event.policy.args['http://example.org/cronTime']!
    const timeToFire = extractDateFromLiteral(timeToFireTerm as Literal)

    const functionToFireTerm = event.policy.args['http://example.org/toFire']!
    const functionToFireIRI = functionToFireTerm.value

    // the source of the actual policy (as of 13/06/2023 nothing is done with this yet)
    const policyLocation  = event.policy.args[AS.object]?.value ?? 'http://localhost:3000/'
    console.log(`${new Date().toISOString()} [fnoCronPlugin] Now called to fire function <${functionToFireIRI}> at ${timeToFire.toISOString()}.`)

    // this could have been any kind of service.
    // It just so happens that it is easier to do it in code within the solid orchestration actor
    const job = new CronJob(timeToFire, () => {
        const policyStore = new Store(event.reasoningResult)

        // function to be executed translated to a policy that has to be executed.
        const pluginToBeExecuted = generate_uuid()
        const pluginToBeExecutedStore = new Store()

        // add function body
        pluginToBeExecutedStore.addQuads(policyStore.getQuads(functionToFireTerm, null, null, null ))
        // add policy triple
        pluginToBeExecutedStore.addQuad(pluginToBeExecuted, namedNode('https://www.example.org/ns/policy#policy'), namedNode(functionToFireTerm.value))
        const newEvent: Event = {
            activity: pluginToBeExecutedStore.getQuads(null,null,null,null),
            data: pluginToBeExecutedStore.getQuads(null,null,null,null),
            from: actor.webID, // hardcoded from (as of 13/06/2023 there is no from and to in the policy result)
            resourceURL: policyLocation
        }
        // can be made more clear if instead of functionToFireIRI we add the function to execute
        // (policyStore.getQuads(functionToFireTerm, fno:executes, null, null )[0].object.value)
        console.log(`${new Date().toISOString()} [fnoCronPlugin] Now firing <${functionToFireIRI}>.`)
        stream.push(newEvent)

    })
    job.start()
}
