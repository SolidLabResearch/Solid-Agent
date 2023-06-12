import {DemoUCPAgent, SubscriptionEnum} from "./src";

async function ucpDemo() {
    // set up CSS:
    const demo = new DemoUCPAgent({
        solid: {
            solidResources: ['http://localhost:3000/'],
            subscriptionType: {type: SubscriptionEnum.PUSH}
        }
    })
    // note: listening to the policies container works through using SolidContainerNotificationClient -> Though no reasoning is executed right now (12/06/2023).
    //  -> fixed by changing the rule and by updating koreografeye to v0.3.2
    await demo.start()

    // curl --data "@/home/wouts/Documents/repos/Agent/Solid-Agent/rules/usage-control/durationPermissionPolicy.ttl" http://localhost:3000/ -H "content-type: text/turtle"
}

ucpDemo()
// step 1: set up server
// $ npx community-solid-server -c memory-no-setup.json
// step 2: set up demoUCPAgent (running this code)
// $ npx ts-node indexUCP.ts
// step 3: send curl request of durationPermissionPolicy
// $ curl --data "@./rules/usage-control/durationPermissionPolicy.ttl" http://localhost:3000/ -H "content-type: text/turtle"

// TODO: execute policies
