# Solid Agent Smart Home demo

## Use case: Synchronising the state of a smart home with a personal data store

The Solid Protocol, an example of a personal data store, defines how to interact with a Solid pod. <br>
To integrate a Smart Home system with Solid, we have created an openHAB actor so that the **Solid Agent** can be configured to synchronize the state with the [openHAB](https://www.openhab.org/) platform and a state resource stored on a Solid pod.

## Demo

### Prerequisites

* Have an openHAB system running with two lights with following names
  * `Bureau_rechts_Color`
  * `Bureau_links_Color`
* Have the configuration of the openHAB system stored in a `.env` resource
  * `OPENHAB_URL`: the URL of the openHAB API endpoint
  * `OPENHAB_API_TOKEN`: the [API token](https://www.openhab.org/docs/configuration/apitokens.html). (Note: With this token, you must have credentials to edit and read the above mentioned lights in the openHAB system)

### Installing + setting up

```sh
# Cloning the repository
git clone https://github.com/SolidLabResearch/Solid-Agent.git

# Go to the Solid-Agent directory
cd Solid-Agent

# Install the dependencies
npm i
```

### Running the demo

To demonstrate this configuration of the Solid Agent, the following steps must be executed:

1.  Start a [Community Solid Server (CSS)](https://github.com/CommunitySolidServer/CommunitySolidServer) at port 3000
    ```shell
    # A Solid server that stores its resources on memory
    npx community-solid-server -c memory-no-setup.json
    # Alternatively, one with stores its resources on the file system can be used
    npx community-solid-server -c @css:config/file-no-setup.json -f ./.data
    ```
    The root storage of this Solid server is at [http://localhost:3000/](http://localhost:3000/) 
2.  Start the code to run the [DemoSolidAgent.ts](../../src/demo/DemoSolidAgent.ts)
    ```shell
    npx ts-node SolidActorIndex.ts
    ```
    This code initalises and executes [DemoSolidAgent.ts](../../src/demo/DemoSolidAgent.ts).
3.  Update the [state resource](http://localhost:3000/state) in Solid to turn the lights on
    ```shell
    # turn lights on with curl request to solid resource
    curl -X PUT --data "@./data/lights_on.ttl" http://localhost:3000/state -H "content-type: text/turtle"
    ```
    This command sends an HTTP PUT request to the state resource with as content RDF (formatted as turtle) of lights on.
4.  Update the [state resource](http://localhost:3000/state) in Solid to turn the lights off
    ```shell
    # turn lights off with curl request to solid resource
    curl -X PUT --data "@./data/lights_off.ttl" http://localhost:3000/state -H "content-type: text/turtle"
    ```
    This command sends an HTTP PUT request to the state resource with as content RDF (formatted as turtle) of lights off.
5.  Update the left light by sending a request to openhab directly
    ```shell
    # turn Bureau_links_Color on with curl request to openHAB api
    curl -X POST --header "Content-Type: text/plain" -d "269,30,11.5" {OPENHAB_URL}/rest/items/Bureau_links_Color -u '{OPENHAB_API_TOKEN}:'
    ```
6.  Update the [state resource](http://localhost:3000/state) in Solid to turn the lights off (same as step 4)
    ```shell
    # turn lights off with curl request to solid resource
    curl -X PUT --data "@./lights_off.ttl" http://localhost:3000/state -H "content-type: text/turtle"
    ```

### Screencast

The following screencast shows how it works when the lights are updated via either the solid state resource or the openhab lights.

[![Screencast](./Philips-hue%20demo.gif)](https://raw.githubusercontent.com/SolidLabResearch/Solid-Agent/main/documentation/iot/Philips-hue%20demo.mp4)

In this screencast, you see four windows:
* On the top left, there is a terminal used to run the `DemoSolidAgent.ts`.
* On the bottom left, the two IoT devices, more specifically two [Philips Hue Smart light bulbs](https://www.philips-hue.com/en-us/products/smart-light-bulbs), are shown.
* On the top right, there is a terminal used to run the Solid Server and to send the HTTP requests to change the status of either the solid resource or the openHAB items directly.
* On the bottom right, there is a web browser which has two tabs open: the openHAB GUI and [Penny](https://penny.vincenttunru.com/).

At the start, we set up the Community Solid Server at port 3000.
When the server is running, the Solid Agent is started. It listens PULL-based to the openHAB items (polling every 5 seconds) and PUSH-based to the state resource on the CSS (`http://localhost:3000/state`) by listening via a WebSocket (using the [Solid Notification Protocol](https://solidproject.org/TR/notifications-protocol)). <br>
Now, the environment is ready, so we send an update (PUT) HTTP request to the state resource with as body [RDF to turn the lights on (left red and right purple)](../../data/lights_on.ttl). 
The Solid Agent receives a notification that the state resource has changed, so it sends two requests to indeed turn the lights on with the given configuration.<br>
Next, a similar request is sent to the state resource. 
This time, however, it is an update request to turn the lights off. 
Which, thanks to the Solid Agent, leads to the lights being shut off again.<br>
To show that the Solid Agent is also configured properly in the other direction, a request to the left light is send to the openHAB API to turn it on.
And we can see that it is updated (Penny window) and the left light indeed turns on. <br>
Finally, the lights are turned off by updating the state resource again.

### Internal operations: How does it work?

In this section, I will try to explain in a bit more detail what happens internally in the [DemoSolidAgent.ts](../../src/demo/DemoSolidAgent.ts). <br>
When the agent is setup for the Smart Home task,
the Solid/OpenHAB Actor send [Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/) (AS2) announcements to the Orchestration Actor.

The Orchestrator Agent, receives this announcement and processes it as follows:
1. It reasons over the announcement using the configured n3 rules
2. The reasoning result is passed to the policy executor which
    1. extracts all the policies
    2. executes the policies based on the plugins and function definitions

This flow is executed with [Koreografeye](https://github.com/eyereasoner/Koreografeye).

To be more specific, here is the flow of one update to the state of the Solid Pod of the End user elaborated:

1.  The **End user** updates the state resource on its **Solid pod** by sending an HTTP PUT request with an [RDF body](../../data/lights_on.ttl) describing how the lights must be actuated in the physical world.
2.  A notification is sent to the **Solid Agent** by the **Solid Pod of the End User** via a [Notification Channel](https://solidproject.org/TR/notifications-protocol#notification-channel).
    * More specifically the Notification Channel used is the [WebSocketChannel2023](https://solid.github.io/notifications/websocket-channel-2023).
3.  The **Solid Agent** fetches the state resource.
4.  The state resource is returned. Its RDF is passed as entry point to Koreografeye in the forms of an [ActivityStreams2 (AS2)](https://www.w3.org/TR/activitystreams-core/) `Announce` message. 
5.  In the Solid Agent, a [Notation3 (N3)](https://w3c.github.io/N3/spec/) reasoner ([EyeJs](https://github.com/eyereasoner/eye-js)) is run with as input the AS2 message and the rules (defined in N3).
    * The rules used for the current configuration are `openHABChangedRule.n3`, `solidChangedRule.n3`, `orchestratorToOpenHAB.n3` and `orchestratorToSolid.n3` (which can be found in the [rules](../../rules/) directory).
6.  As a conclusion of this reasoning task, we get one Koreografeye Policy: a *hasStateChanged* policy.
    * In this case, it was the `solidChangedRule.n3` that got its premises matched.
7.  The *hasStateChanged* Plugin is executed. It compares the state retrieved from the **Solid Pod of the End User** with the state of the **Solid Agent**.
    * In this comparison, the subgraphs for each subject are compared. When a subgraph is not isomorph, a new AS2 `Announce` message is passed to the entry of Koreografeye. 
8.  Again, the N3 reasoner is run with as input the AS2 message and the rules.
9.  This time we get the *updateOpenHABState* policy as a conclusion since it was the `orchestratorToOpenHAB.n3` rule that got its premises matched.
10. The *updateOpenHABState* Plugin is executed, which consists of two tasks
    *  Translate the RDF representation of the light to an openHAB item (done in this step).
    *  Send an authenticated POST request to the openHAB endpoint.
11. The **Solid Agent** sends the request to the openHAB endpoint to change the state of the item. 

These steps are also visualised in the following UML sequence diagram:

![high level UML diagram](../../img/23-07-04_Philips-hue-solid(UML-high-level).png)

### Low-Level explanation

This section explains the initialisation of the [DemoSolidAgent.ts](../../src/demo/DemoSolidAgent.ts). <br>
Furthermore, an in-depth execution flow is given. This will make it clear that the execution *Condition Action* rules are implemented through [Koreografeye](https://github.com/eyereasoner/Koreografeye).


![low level UML diagram](../../img/23-07-04_Philips-hue-solid(UML-low-level).png)

### Example flow: OpenHAB light its color was changed using the openhab platform

The openHAB actor sends an AS announcement to the Orchestration agent because its color has changed to purple:

```turtle
<#uuid> a as:Announce;
    as:actor <openHAB>;
    as:object <Bureau_rechts_Color> .

<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 272 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 60 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 21 .
```

The Orchestration actor has the following rules in its engine:
* [openHABChangedRule.n3](../../rules/openHABChangedRule.n3)
* [orchestratorToOpenHAB.n3](../../rules/orchestratorToOpenHAB.n3)
* [orchestratorToSolid.n3](../../rules/orchestratorToSolid.n3)
* [solidChangedRule.n3](../../rules/solidChangedRule.n3)

In the reasoning step, only the following rule openHABChangedRule.n3 its premises match the announcement fact.
So the conclusion, i.e. the result of the reasoning over all rules, is the following:

```turtle
<75e14f61-2f3f-414f-80c8-a6371c00a431> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/ns/activitystreams#Announce> .
<75e14f61-2f3f-414f-80c8-a6371c00a431> <https://www.w3.org/ns/activitystreams#actor> <openHAB> .
<75e14f61-2f3f-414f-80c8-a6371c00a431> <https://www.w3.org/ns/activitystreams#object> <Bureau_rechts_Color> .
<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 272 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 60 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 21 .
_:b2_sk_0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/function/ontology#Execution> .
_:b2_sk_0 <https://w3id.org/function/ontology#executes> <http://example.org/hasStateChanged> .
_:b2_sk_0 <http://example.org/param1> <solid> .
_:b2_sk_0 <http://example.org/param2> <http://localhost:3000/state> .
_:b2_sk_0 <http://example.org/body> <75e14f61-2f3f-414f-80c8-a6371c00a431> .
<http://example.org/MyDemoPolicy> <https://www.example.org/ns/policy#policy> _:b2_sk_0 .
```

As mentioned executing the policies is two-fold.
First, the policy is extracted from the above output.

This is the policy with following function `ex:hasStateChanged`.
The function *fnoHasStateChanged* is then called internally, which does the following:
> Checks whether the data from the event is isomorphic with internal state.
> When it is not isomorphic, the data has changed, so a notification is added to stream with an announcement to update an actor.
The updating of the actor is based on the policy.

This function is then executed
This means the following announcement is sent from the orchestrator actor to itself:
```turtle
@prefix as: <https://www.w3.org/ns/activitystreams#>.
<21586d1f-75e8-421a-a42b-4ec306db1d38> a as:Announce;
    as:actor <orchestrator> ;
    as:target <solid>;
    as:to <http://localhost:3000/state>.
<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 272 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 60 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 12 .
```

This triggers another round of the Koreografeye:

The only rule now that its premises matches the above fact is the [orchestratorToSolid.n3](../../rules/orchestratorToSolid.n3).
Its conclusion is the following:

```turtle
<21586d1f-75e8-421a-a42b-4ec306db1d38> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/ns/activitystreams#Announce> .
<21586d1f-75e8-421a-a42b-4ec306db1d38> <https://www.w3.org/ns/activitystreams#actor> <orchestrator> .
<21586d1f-75e8-421a-a42b-4ec306db1d38> <https://www.w3.org/ns/activitystreams#target> <solid> .
<21586d1f-75e8-421a-a42b-4ec306db1d38> <https://www.w3.org/ns/activitystreams#to> <http://localhost:3000/state> .
<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 272 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 60 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 12 .
_:b3_sk_0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/function/ontology#Execution> .
_:b3_sk_0 <https://www.w3.org/ns/activitystreams#target> <solid> .
_:b3_sk_0 <https://www.w3.org/ns/activitystreams#to> <http://localhost:3000/state> .
_:b3_sk_0 <https://w3id.org/function/ontology#executes> <http://example.org/updateSolidState> .
_:b3_sk_0 <http://example.org/body> <21586d1f-75e8-421a-a42b-4ec306db1d38> .
<http://example.org/MyDemoPolicy> <https://www.example.org/ns/policy#policy> _:b3_sk_0 .

```
And now, the policy with function `ex:updateSolidState` is extracted, resulting in *fnoUpdateSolidState* to be executed.

This function does the following:

> Updates the state of the orchestration agent with the data of the event
> Sends an action to the solid actor to the items based on the state.

So an event is sent to the inbox of a Solid Actor with webid <solid> with as target to update the resource with this state.

So this whole flow results into the ldp:resource with url `http://localhost:3000/state`
to be synchronised with the state of the philips hue light controlled by the openhab platform. -->
