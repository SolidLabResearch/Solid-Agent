// Forms a new policy -> send back to orch?
// So actor: orch and a new policy for now execution is send to that actor

// How should it work for KoreoGrafeye? | discuss later with Patrick

//TODO: copy output of the rule and start with that
import {Event, PluginFunction} from "../orchestration/OrchestrationActorInterface";
import {CronJob} from "cron";
import {DataFactory, Literal, Store} from "n3";
import {extractDateFromLiteral} from "../util/TimeStampUtil";
import {AS} from "../Vocabulary";
import {generate_uuid} from "koreografeye";
import namedNode = DataFactory.namedNode;


export const fnoCronPlugin: PluginFunction = async function (event, actor, optional): Promise<void> {
    if (event.policy === undefined) throw Error()
    if (optional === undefined) throw Error()
    if (optional.stream === undefined) throw Error()

    const timeToFireTerm = event.policy.args['http://example.org/cronTime']!
    const timeToFire = extractDateFromLiteral(timeToFireTerm as Literal)

    const functionToFireTerm = event.policy.args['http://example.org/toFire']!
    const functionToFireIRI = functionToFireTerm.value

    // the source of the actual policy (as of 13/06/2023 nothing is done with this yet)
    const policyLocation  = event.policy.args[AS.object]?.value ?? 'http://localhost:3000/'
    console.log(`${new Date().toISOString()} [fnoCronPlugin] Now called to fire function <${functionToFireIRI}> at ${timeToFire.toISOString()}.`)
    const job = new CronJob(timeToFire, () => {
        const policyStore = new Store(event.reasoningResult)

        // function to be executed translated to a policy that has to be executed.
        const pluginToBeExecuted = generate_uuid()
        const pluginToBeExecutedStore = new Store()

        // const fnoExecutionTerm = policyStore.getQuads(null, null, functionToFireTerm, null )[0].subject // might fail
        // add function body
        pluginToBeExecutedStore.addQuads(policyStore.getQuads(functionToFireTerm, null, null, null ))
        // add policy triple
        pluginToBeExecutedStore.addQuad(pluginToBeExecuted, namedNode('https://www.example.org/ns/policy#policy'), namedNode(functionToFireTerm.value))
        const newEvent: Event = {
            activity: [],
            data: pluginToBeExecutedStore.getQuads(null,null,null,null),
            from: actor.webID, // hardcoded from (as of 13/06/2023 there is no from and to in the policy result)
            resourceURL: policyLocation
        }
        console.log(`${new Date().toISOString()} [fnoCronPlugin] Now firing <${functionToFireIRI}>.`)
        // TODO: check when passing to stream results into trying to fire the function

    })
    job.start()
}

/*# cron policy plugin design attempt 1
<urn:uuid:c4933e60-06db-11ee-94ef-973c373c3405> pol:policy <urn:uuid:c4934040-06db-11ee-993c-cba990f7b8a5>.
<urn:uuid:c4934040-06db-11ee-993c-cba990f7b8a5> a fno:Execution.
<urn:uuid:c4934040-06db-11ee-993c-cba990f7b8a5> ex:cronTime "2023-06-09T15:40:36Z"^^xsd:dateTime.
<urn:uuid:c4934040-06db-11ee-993c-cba990f7b8a5> ex:toFire <urn:uuid:c4934176-06db-11ee-8632-5fd8bf7ebe12>.
<urn:uuid:c4934040-06db-11ee-993c-cba990f7b8a5> fno:executes ex:cronJob.

# function that cron job will execute
<urn:uuid:c4934176-06db-11ee-8632-5fd8bf7ebe12> a fno:Execution.
<urn:uuid:c4934176-06db-11ee-8632-5fd8bf7ebe12> ex:agent <https://ruben.verborgh.org/profile/#me>.
<urn:uuid:c4934176-06db-11ee-8632-5fd8bf7ebe12> ex:mode acl:Read.
<urn:uuid:c4934176-06db-11ee-8632-5fd8bf7ebe12> ex:policyType ids:Prohibition.
<urn:uuid:c4934176-06db-11ee-8632-5fd8bf7ebe12> ex:target <https://tree.linkeddatafragments.org/sytadel/ldes/ais>.
<urn:uuid:c4934176-06db-11ee-8632-5fd8bf7ebe12> fno:executes ex:changeAcl.*/
