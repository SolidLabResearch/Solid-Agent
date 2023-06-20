# Usage Control Policy (UCP) demo

## Use case: Temporal Usage Control Policy execution for Solid Resources

The [International Data Space Association (IDSA)](https://internationaldataspaces.org/) defines several [IDS Usage Control Policies](https://international-data-spaces-association.github.io/DataspaceConnector/Documentation/v6/UsageControl).
**The Duration-restricted Data Usage policy** is a temporal UCP which allows data usage for a specified time period.

Below is an example of such a policy.

```ttl
@prefix : <http://example.org/socrates#>.
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix ids: <https://w3id.org/idsa/core/> .
@prefix idsc: <https://w3id.org/idsa/code/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://w3id.org/idsa/autogen/permission/3b1439a1-4136-4675-b5a0-798ec3148996>
  a <https://w3id.org/idsa/core/Permission> ;
  ids:action <https://w3id.org/idsa/code/USE> ;
  ids:constraint <https://w3id.org/idsa/autogen/constraint/b7d8beaf-0765-4d40-b2e9-4eddeda1c89b> ;
  ids:description "duration-usage"^^xsd:string ;
  ids:target <http://localhost:3000/ldes> ;
  odrl:assignee <https://woslabbi.pod.knows.idlab.ugent.be/profile/card#me> ;
  ids:title "Example Usage Policy"^^xsd:string .

<https://w3id.org/idsa/autogen/constraint/b7d8beaf-0765-4d40-b2e9-4eddeda1c89b>
  a ids:Constraint ;
  ids:leftOperand <https://w3id.org/idsa/code/ELAPSED_TIME> ;
  ids:operator <https://w3id.org/idsa/code/SHORTER_EQ> ;
  ids:rightOperand "PT30S"^^xsd:duration .
```

This policy states that an assignee (`https://woslabbi.pod.knows.idlab.ugent.be/profile/card#me`) has at time t<sub>1</sub> (t<sub>1</sub>=time at which this policy is active) till t<sub>1</sub> + a period (30 seconds) access to target resource (`http://localhost:3000/ldes`).

At the time of writing, however, no implementations exist that allow you to use an IDSA UCP to define access control over [Solid](https://solidproject.org/TR/protocol) resources.

To enforce Usage Control Policies, two plugins ([AclPlugin](../../src/plugins/AclPlugin.ts) and [CronPlugin](../../src/plugins/CronPlugin.ts)) were implemented and an example rule ([CronRule](../../rules/usage-control/CronRule.n3)) was crafted for the [Solid Agent](../../README.md).
[DemoUCPAgent.ts](../../src/demo/DemoUCPAgent.ts) contains a class **DemoUCPAgent** which configures the Solid Agent with these plugins and rule.

## Demo

To demonstrate this configuration of the Solid Agent, following steps must be executed:

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
    This code starts a [CSS](http://localhost:3123/) for the solid actor where it also creates an account so the Solid Actor has a [WebID](http://localhost:3123/solid/profile/card#me).
    Furthermore, it creates the [policy container](http://localhost:3000/policies/) and creates a [simple RDF resource](http://localhost:3000/ldes) which is used as target resource.
    When this initialisation sequence is executed, the code finally starts the [DemoUCPAgent.ts](../../src/demo/DemoUCPAgent.ts).
3.  Send a **duration usage-restricted access** UCP to the policy container.
    ```shell
    # Approach one with a curl request
    curl --data "@./rules/usage-control/durationPermissionPolicy.ttl" http://localhost:3000/policies -H "content-type: text/turtle"
    # Second approach with the UcpSendPolicy.ts script
    npx ts-node UcpSendPolicy.ts
    ```
    The first approach sends an HTTP POST request to the policy container with as content the duration policy as in the example above.
    The second approach executes the same duration policy using a typescript script.
    It is a bit easier to adapt the WebID, target resource or the duration time, and additionally it logs to the console what will happen.

Following screencast shows how it works when we send a policy

![](./demo-Duration-UCP.mp4)
[//]: # (TODO: elaborate the screencast )
### How it works

In this section, I will try to explain in a bit more detail what happens internally in the [DemoUCPAgent.ts](../../src/demo/DemoUCPAgent.ts).

1. The policy has been added to the policy container (can be done by executing step 3)
2. A notification is sent to the Solid Actor, which then fetches the newly added policy (`policy1`)
3. An N3 reasoner (EyeJs) is run with as input the policy and the rules (which is in the `CronRule.n3` in this case)
4. As a conclusion of this reasoning task, we get two Koreografeye Policies. An Acl Policy and a CronJob Policy (with as body an Acl Policy). 
    * The ACL Plugin changes the acl of `resource` so that the `odrl:assignee` now has `acl:Read` access to `resource`.
    * The Cronjob Plugin starts a timer, so that in 30 seconds a prohibition ACL plugin is executed
5. After the 30 seconds have passed, the CronJob starts the prohibition execution
    * The Acl Plugin changes the acl of `resource` so that the `odrl:assignee` now has no access anymore to `resource`.
   
![](./Solid-Agent-UCP%20use%20case%20(flow).png)


## Limitations/Assumptions

This demo has been made as a sprint, so some shortcuts and assumptions were taken in this prototype. 
They are listed below with some explanation:

* The **Usage Control Policy Knowledge Graph (UCP KG)** is modelled as a solid container, which furthermore requires that the solid server supports the [Solid Notifications Protocol](https://solidproject.org/TR/notifications-protocol) v0.2.0.
  * This way, the agent can listen to any policy addition
  * Additionally, we can then assume that the KG of UCPs is valid. 
    The agent does not check whether the complete set of UCPs are valid or not, it will only execute them. 
    Any conflicts in the UCP KG thus are the fault of the end user, not of the agent.
* For each target resource (`ids:target`), the agent MUST have `acl:Control` permission.
* The [Solid Protocol](https://solidproject.org/TR/protocol) defines two options for Authorization (§11): **Web Access Control (WAC)** and **Access Control Policy (ACP)**.
  * The agent assumes that the Solid server hosting the target resources support WAC (and therefore Access Control List (ACL) resources).
* The N3 rules contain built-ins that do work with the [EYE reasoner](https://github.com/eyereasoner/eye), though no guarantees can be made with other N3 reasoners.
* As of 20/06/2023, only the *Duration-restricted Data Usage* from [IDS Usage Control Policies](https://international-data-spaces-association.github.io/DataspaceConnector/Documentation/v6/UsageControl#ids-usage-control-policies) has been implemented and tested as N3 Rule.
  * Due to how [Koreografeye](https://github.com/eyereasoner/Koreografeye) extracts policies from the Reasoning Result, the cardinality of target resources and assignees can only be 1.
    A [feature request](https://github.com/eyereasoner/Koreografeye/issues/10) has been made to solve this problem at its root.
  * The triple `<permissionIdentifier> <odrl:assignee> <webID> .` was added to the UCP to make sure we have a webID to which we can give access (though this was not described in the [Pattern examples](https://international-data-spaces-association.github.io/DataspaceConnector/Documentation/v6/UsageControl#duration-usage-2)).
* Giving Permission equals to giving read access (`acl:Read`)
