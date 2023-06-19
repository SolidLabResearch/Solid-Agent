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

1.  Start a CSS at port 3000
    ```shell
    # A Solid server that stores its resources on memory and uses WAC for authorization
    npx community-solid-server -c memory-no-setup.json
    # Alternatively, one with stores its resources on the file system can be used
    npx community-solid-server -c @css:config/file-no-setup.json -f ./.data
    ```
2.  Start the code to run the DemoUCPAgent
    ```shell
    npx ts-node indexUCP.ts
    ```
[//]: # (   TODO: elaborate on what this actually does)
3.  Send a UCP to the policy container at `http://localhost:3000/policies/`
    ```shell
    curl --data "@./rules/usage-control/durationPermissionPolicy.ttl" http://localhost:3000/policies -H "content-type: text/turtle"
    ```
[//]: # (   TODO: explain that http://localhost:3123/solid/profile/card#me needs a priori `acl:Control` access on the target resource)

### How it works

1. The policy has been added to the container (can be done by executing step 3)
2. A notification is sent to the Solid Actor, which then fetches the newly added policy (`policy1`)
3. An N3 reasoner (EyeJs) is run with as input the policy and the rules (which is in the `CronRule.n3` in this case)
4. As a conclusion of this reasoning task, we get two Koreografeye Policies. An Acl Policy and a CronJob Policy (with as body an Acl Policy). 
    * The ACL Plugin changes the acl of `resource` so that the `odrl:assignee` now has `acl:Read` access to `resource`.
    * The Cronjob Plugin starts a timer, so that in 30 seconds a prohibition ACL plugin is executed
5. After the 30 seconds have passed, the CronJob starts the prohibition execution
    * The Acl Plugin changes the acl of `resource` so that the `odrl:assignee` now has no access anymore to `resource`.
   
![](./Solid-Agent-UCP%20use%20case%20(flow).png)
