import {createAccount, DemoUCPAgent, getAuthenticatedSession, instantiateCSS, SubscriptionEnum} from "./src";

const baseURL = "http://localhost:3000/"
const policyContainer = baseURL + "policies/"
const webID = "https://woslabbi.pod.knows.idlab.ugent.be/profile/card#me"
const resource = "http://localhost:3000/ldes"

const agentPort = 3123
const agentBaseUrl = `http://localhost:${agentPort}/`
const solidAgentPodName = 'solid'
const solidAgentWW = "as;dklfje"
const solidAgentMail = "solid@SolidAgent.css"
const solidAgentWebID = `${agentBaseUrl}${solidAgentPodName}/profile/card#me`

async function ucpInitialisation() {
    // create resource
    await fetch(resource, {
        method: "PUT",
        headers: {
            "content-type": "text/turtle"
        },
        body: "<http://localhost:3000/ldes> a <https://w3id.org/ldes#EventStream>."
    })

    // create policy container
    await fetch(policyContainer, {
        method: "PUT"
    })

    // setup CSS with idp for agent
    const app = await instantiateCSS(agentPort)
    await app.start();

    // create account for agent
    await createAccount(agentBaseUrl, {email: solidAgentMail, password: solidAgentWW, podName: solidAgentPodName})
}

async function ucpDemo() {
    // set up CSS: $ npx community-solid-server -c memory-no-setup.json

    // initialise resource + policy container
    await ucpInitialisation()

    const demo = new DemoUCPAgent({
        solid: {
            solidResources: [policyContainer],
            subscriptionType: {type: SubscriptionEnum.PUSH}
        }
    })
    // note: listening to the policies container works through using SolidContainerNotificationClient -> Though no reasoning is executed right now (12/06/2023).
    //  -> fixed by changing the rule and by updating koreografeye to v0.3.2
    await demo.start()

    // // testing auth
    const session = await getAuthenticatedSession({webId: solidAgentWebID, email: solidAgentMail, password: solidAgentWW})
    const res = await session.fetch(`${agentBaseUrl}${solidAgentPodName}/profile/`)
    console.log("Testing Solid Actor Authentication. Status:",res.status)
    // curl --data "@/home/wouts/Documents/repos/Agent/Solid-Agent/rules/usage-control/durationPermissionPolicy.ttl" http://localhost:3000/ -H "content-type: text/turtle"
}

ucpDemo()
// step 1: set up server
// $ npx community-solid-server -c memory-no-setup.json
// step 2: set up demoUCPAgent (running this code)
// $ npx ts-node indexUCP.ts
// step 3: send curl request of durationPermissionPolicy
// $ curl --data "@./rules/usage-control/durationPermissionPolicy.ttl" http://localhost:3000/ -H "content-type: text/turtle"
