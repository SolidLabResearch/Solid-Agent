# Usage Control Policy (UCP) demo

## Use case: Temporal Usage Control Policy execution for Solid Resources

The [International Data Space Association (IDSA)](https://internationaldataspaces.org/) defines several [IDS Usage Control Policies](https://international-data-spaces-association.github.io/DataspaceConnector/Documentation/v6/UsageControl).
**The Duration-restricted Data Usage policy** is a temporal UCP which allows data usage for a specified period.

Below is an example of such a policy.

```ttl
@prefix dct: <http://purl.org/dc/terms/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://example.com/offer> a odrl:Offer ;
   dct:description "Restrict the data usage to 30 seconds" ;
   odrl:uid <https://example.com/offer> ;
   odrl:permission [
       odrl:assigner <https://example.com/solid-agent> ;
       odrl:action odrl:use ;
       odrl:target <http://localhost:3000/ldes> ;
       odrl:constraint [
           odrl:leftOperand odrl:elapsedTime ;
           odrl:operator odrl:eq ;
           odrl:rightOperand "PT30S"^^xsd:duration 
       ] 
   ] .
  
@prefix : <http://example.org/socrates#>.
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix ids: <https://w3id.org/idsa/core/> .
@prefix idsc: <https://w3id.org/idsa/code/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://example.com/3b1439a1-4136-4675-b5a0-798ec3148996>
  a odrl:Permission ;
  odrl:action odrl:read ;  
  odrl:constraint <https://example.com/b7d8beaf-0765-4d40-b2e9-4eddeda1c89b> ;
  odrl:target <http://localhost:3000/ldes> ;
  odrl:assignee <https://woslabbi.pod.knows.idlab.ugent.be/profile/card#me> ;

<https://example.com//b7d8beaf-0765-4d40-b2e9-4eddeda1c89b>
  odrl:leftOperand odrl:elapsedTime ;
  odrl:operator odrl:eq ;
  odrl:rightOperand "PT30S"^^xsd:duration 
```

This policy states that an assignee (`https://woslabbi.pod.knows.idlab.ugent.be/profile/card#me`) has at time t<sub>1</sub> (t<sub>1</sub>=time at which this policy is active) till t<sub>1</sub> + a period (30 seconds) access to target resource (`http://localhost:3000/ldes`).

At the time of writing, however, no implementations exist that allow you to use an IDSA UCP to define access control over [Solid](https://solidproject.org/TR/protocol) resources.

To enforce Usage Control Policies, two plugins ([AclPlugin](../../src/plugins/AclPlugin.ts) and [CronPlugin](../../src/plugins/CronPlugin.ts)) were implemented and an example rule ([CronRule](../../rules/usage-control/CronRule.n3)) was crafted for the [Solid Agent](../../README.md).
[DemoUCPAgent.ts](../../src/demo/DemoUCPAgent.ts) contains a class **DemoUCPAgent** which configures the Solid Agent with these plugins and this rule.

## Demo

### Prerequisites

* The user has a WebID and pod.
  You can create both for testing via the [Pod Playground of SolidLab](https://pod.playground.solidlab.be/).
### Installing + setting up

```shell
# Cloning the repository
git clone https://github.com/SolidLabResearch/Solid-Agent.git

# Go to the Solid-Agent directory
cd Solid-Agent

# Install the dependencies
npm i
```

Now that everything is installed and you are still in the Solid-Agent directory, you can run this demo.

### Running the demo

To demonstrate this configuration of the Solid Agent, the following steps must be executed:

1.  Start a [Community Solid Server (CSS)](https://github.com/CommunitySolidServer/CommunitySolidServer) at port 3000
    ```shell
    # A Solid server that stores its resources on memory and uses WAC for authorization
    npx community-solid-server -c memory-no-setup.json
    # Alternatively, one with stores its resources on the file system can be used
    npx community-solid-server -c @css:config/file-no-setup.json -f ./.data
    ```
    The root storage of this Solid server is at [http://localhost:3000/](http://localhost:3000/) 
2.  Start the code to run the [DemoUCPAgent.ts](../../src/demo/DemoUCPAgent.ts)
    ```shell
    npx ts-node indexUCP.ts
    ```
    This code starts a [CSS](http://localhost:3123/) for the solid actor where it also creates an account so the Solid Actor has a [WebID](http://localhost:3123/solid/profile/card#me). <br>
    Furthermore, it creates the [policy container](http://localhost:3000/policies/) and creates a [simple RDF resource](http://localhost:3000/ldes) which is used as target resource. <br>
    When this initialisation sequence is executed, the code finally starts the [DemoUCPAgent.ts](../../src/demo/DemoUCPAgent.ts).
3.  Send a **duration usage-restricted access** UCP to the policy container.
    ```shell
    # Approach one with a curl request
    curl --data "@./rules/usage-control/durationPermissionPolicy.ttl" http://localhost:3000/policies -H "content-type: text/turtle"
    # Second approach with the UcpSendPolicy.ts script
    npx ts-node UcpSendPolicy.ts
    ```
    The first approach sends an HTTP POST request to the policy container with as content the duration policy as in the example above. <br>
    The second approach executes the same duration policy using a typescript script. <br>
    It is a bit easier to adapt the WebID, target resource or the duration time, and additionally, it logs to the console what will happen. <br>
    E.g. The WebID can be changed by editing [line 37](https://github.com/SolidLabResearch/Solid-Agent/blob/392a822386c2feae8c2fba9325bfbd42c448344b/UcpSendPolicy.ts#L37) in `UcpSendPolicy.ts`
4.  (Optional) To verify whether you have access to the resource for the given duration, you can authenticate with the configured WebID in [Penny](https://penny.vincenttunru.com/). <br>
    There, in the top search bar you put in the URL of the resource (`http://localhost:3000/ldes`). <br>
    Now you can verify that indeed you only have access to the resource through Penny for the given duration after you have sent the UCP to the policy container.

### Screencast

The following screencast shows how it works when we send a policy.

[![Screencast](./demo-Duration-UCP.gif)](https://raw.githubusercontent.com/woutslabbinck/Solid-Agent/58da48d3bf0cadf113a26911f5304456288e4441/documentation/ucp/demo-Duration-UCP.mp4)

In this screencast, you see three windows:

* On the left, we have [Penny](https://penny.vincenttunru.com/) where I've logged in with WebID `https://woutslabbinck.solidcommunity.net/profile/card#me`.
  In this window, I can now browse resources on Solid Pods while being authenticated.
* On the top right, the Solid Agent in the `DemoUCPAgent.ts` configuration is running (see step 2)
* On the bottom right, there is a blank terminal which will be used to send a policy to the Usage Control Policy Knowledge Graph (UCP KG) (i.e. the policy container)

At the start, we are authenticated and see the storage of the Solid pod of [woutslabbinck](https://woutslabbinck.solidcommunity.net/profile/card#me). <br>
[woutslabbinck](https://woutslabbinck.solidcommunity.net/profile/card#me) wants to access the resource at URL `http://localhost:3000/ldes`, but does not have access. <br>
However, there is a policy from the owner of that resource that can be activated. 
This policy allows the assignee ([woutslabbinck](https://woutslabbinck.solidcommunity.net/profile/card#me)) to have read access to the [resource](http://localhost:3000/ldes) for a period of 30 seconds ("PT30S"^^xsd:duration).<br>
In the bottom right pane, this policy is sent to the UCP KG, which the **DemoUCPAgent** then immediately enforces. <br>
Now, while authenticated as [woutslabbinck](https://woutslabbinck.solidcommunity.net/profile/card#me), we can see the resource in Penny. <br>
Finally, when 30 seconds have passed, the **DemoUCPAgent** executes the final part of the policy and takes away read access control for [woutslabbinck](https://woutslabbinck.solidcommunity.net/profile/card#me), as defined in the Usage Control Policy. 


### How does it work?

In this section, I will try to explain in a bit more detail what happens internally in the [DemoUCPAgent.ts](../../src/demo/DemoUCPAgent.ts).

1. The **End User** fetches the resource sends an authenticated HTTP GET request to the `resource` (1.1), but is not authorized to access the resource so a HTTP Response with status code 401 is returned (1.2).
2. The policy has been added to the **UCP Knowledge Graph** (i.e. the policy container) by the **Resource Owner**
    * In the demo, this is done by executing step 3.
3. A notification is sent to the **Solid Agent** (3.1), which then fetches the newly added policy (`policy1`) (3.2 & 3.3).
4. In the **Solid Agent**, an N3 reasoner (EyeJs) is run with as input the policy and the rules (which is in the `CronRule.n3` in this case).
5. As a conclusion of this reasoning task, we get two Koreografeye Policies. An Acl Policy and a CronJob Policy (with as function to fire an Acl Policy).
    * The ACL Plugin changes the acl of `resource` so that the **End User** (`odrl:assignee`) now has `acl:Read` access to `resource` (5.2).
        * At this point, the **End User** has access to the `resource`
    * The Cronjob Plugin starts a timer so that in 30 seconds a prohibition ACL plugin is executed (5.3)
6. The **End User** fetches the resource sends an authenticated HTTP GET request to the `resource` (6.1), now the contents of the resource are returned (6.2).
7. After the 30 seconds have passed, the CronJob starts the prohibition execution
    * The Acl Plugin changes the acl of `resource` so that the **End User** now has no access anymore to `resource`.
        * Now, the **End User** does not have access to the `resource` anymore
8. The **End User** fetches the resource sends an authenticated HTTP GET request to the `resource` (8.1), but is not authorized to access the resource so a HTTP Response with status code 401 is returned (8.2).
These steps are also visualised in the following UML sequence diagram:
![](./Solid-agent-UCP%20use%20case%20(high%20level%20UML).png)  


<!-- ![](./Solid-Agent-UCP%20use%20case%20(flow).png) -->

### Low-Level explanation

This section explains the execution flow within the Demo UCP initialisation of the Solid Agent, which is based on the [Koreografeye](https://github.com/eyereasoner/Koreografeye) [architecture](https://github.com/eyereasoner/Koreografeye/blob/main/documentation/architecture.md).

In this setting, the Solid Agent consists of two actors: 

* **Solid Actor**: This actor is an Interface Actor (see [architecture S. Kirrane](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3945443)) which interacts with Solid Resources and the other Orchestration Actor.
* **Orchestration Actor**: Executes the Koreografeye execution flow in a streaming way and interacts/orchestrates with other actors within the Solid Agent.

1. The **Solid Actor** is configured to subscribe to a container, more specifically: the Policy Container.
   * Each time a resource is added to that container, the actor is notified. Then, the actor fetches the `resource` and passes it to the **Orchestration Actor**.
2. The first step of the **Orchestration Actor** is the reasoning step, executed by the **Reasoner**. 
   * In the **Reasoner**, the EYE reasoner is executed with as premise the [CronRule](../../rules/usage-control/CronRule.n3) and the `resource` (a duration UCP).
   * The conclusion, in this case, consists of two [Koreografeye policies](https://github.com/eyereasoner/Koreografeye/blob/main/documentation/architecture.md), which are defined in RDF
     * A CronJob policy that contains the description that an ACL policy MUST be executed in 30 seconds from t<sub>now</sub>.
     * An ACL policy that contains the description that the ACL auxiliary resource of the `resource` MUST be updated so that the **End User** has `acl:Read` permission.
   * The whole conclusion is passed to the next step: the **Policy Extractor**.
3. The **Policy Extractor** extracts the two Koreografeye policies from the conclusion. 
    Then it passes them both asynchronously to the next step the **Policy Executor**.
4. The **Policy Executor** receives a policy and executes it. Per policy, it fetches the plugin (based on the `fno:executes` predicate) and runs the plugin with as arguments the policy and an actor
   * The [fnoChangeAcl](../../src/plugins/AclPlugin.ts) changes the ACL auxiliary resource of `resource` using the Solid Actor to `acl:Read` for the WebID of **End User**.
   * The [fnoCronPlugin](../../src/plugins/CronPlugin.ts) fires a new policy, in this case removing `acl:Read` access for **End User** of `resource`, in t<sub>now</sub> + 30 seconds to the orchestrator.
5. The **Orchestration Actor** is run again with as input the policy retrieved from the *fnoCronPlugin*.
   * The **Reasoner** will not infer anything new, though as the conclusion also contains the input, there is an ACL policy (Prohibition) present. The conclusion is passed to the **Policy Extractor**.
   * The **Policy Extractor** extracts the ACL policy and passes it to the **Policy Executor**.
   * The **Policy Executor** fetches the fnoChangeAcl plugin which gets executed: now the **End User** does not have `acl:Read` access to `resource` anymore.

This flow is also visualized in the following UML sequence diagram: 

![stub](./Solid-agent-UCP%20use%20case%20(low%20level%20UML).png)

#### Comparison with Koreografeye

The general approach of the Solid Agent follows the *reason, extract, execute* approach of Koreografeye. 
However, it extends Koreografeye by continuously running.
Let me elaborate on this: in Koreografeye, first, you reason over data (RDF) and rules (N3) and as a result, you get a conclusion (RDF). Then you execute the policies by using this conclusion and plugins.
With the Solid Agent, it is possible to listen to a given resource (or container like an `ldp:inbox` container or in this case the policy container) (not limited to Solid) and apply the whole Koreografeye flow on every change in that resource.

Furthermore, the Solid Agent plugins currently have an extra argument (and optional third) compared to the plugins of Koreografeye.
This extra argument is the **actor** which should be used in the plugin to execute an (authenticated) interface call.
E.g. The Solid Actor can be used to send authenticated requests to a Solid Pod.
In Koreografeye, this is handled by parsing a `.env` file.

The plugins used in this demo can, however, be used stand-alone by wrapping them in a class and extending the `PolicyPlugin` abstract class.

## Limitations/Assumptions

This demo has been made as a sprint, so some shortcuts and assumptions were taken in this prototype. 
They are listed below with some explanation:

* The **Usage Control Policy Knowledge Graph (UCP KG)** is modelled as a solid container, which furthermore requires that the solid server supports the [Solid Notifications Protocol](https://solidproject.org/TR/notifications-protocol) v0.2.0.
  * This way, the agent can listen to any policy addition
  * Additionally, we can then assume that the KG of UCPs is valid. 
    The agent does not check whether the complete set of UCPs is valid or not, it will only execute them. 
    Any conflicts in the UCP KG thus are the fault of the end user, not of the agent.
* For each target resource (`ids:target`), the agent MUST have `acl:Control` permission.
* The [Solid Protocol](https://solidproject.org/TR/protocol) defines two options for Authorization (§11): **Web Access Control (WAC)** and **Access Control Policy (ACP)**.
  * The agent assumes that the Solid server hosting the target resources support WAC (and therefore Access Control List (ACL) resources).
* The N3 rules contain built-ins that do work with the [EYE reasoner](https://github.com/eyereasoner/eye), though no guarantees can be made with other N3 reasoners.
* As of 20/06/2023, only the *Duration-restricted Data Usage* from [IDS Usage Control Policies](https://international-data-spaces-association.github.io/DataspaceConnector/Documentation/v6/UsageControl#ids-usage-control-policies) has been implemented and tested as N3 Rule.
  * Due to how [Koreografeye](https://github.com/eyereasoner/Koreografeye) extracts policies from the Reasoning Result, the cardinality of target resources and assignees can only be 1.
    A [feature request](https://github.com/eyereasoner/Koreografeye/issues/10) has been made to solve this problem at its root.
  * The triple `<permissionIdentifier> <odrl:assignee> <WebID> .` was added to the UCP to make sure we have a WebID to which we can give access (though this was not described in the [Pattern examples](https://international-data-spaces-association.github.io/DataspaceConnector/Documentation/v6/UsageControl#duration-usage-2)).
* Giving Permission equals to giving read access (`acl:Read`)
