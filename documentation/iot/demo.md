# Demo Philips Hue

## Demo

## Prerequisites

* Have an openHAB system running with two lights with following names
  * `Bureau_rechts_Color`
  * `Bureau_links_Color`
* Have the configuration of the openHAB system stored in a `.env` resource
  * `OPENHAB_URL`: the URL of the openHAB API endpoint
  * `OPENHAB_API_TOKEN`: the [API token](https://www.openhab.org/docs/configuration/apitokens.html). (Note: With this token, you must have credentials to edit and read the above mentioned lights in the openHAB system)

## Installing + setting up

```sh
# Cloning the repository
git clone https://github.com/SolidLabResearch/Solid-Agent.git

# Go to the Solid-Agent directory
cd Solid-Agent

# Install the dependencies
npm i
```

## Running the demo

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

[![Screencast](./Philips-hue%20demo.gif)](https://raw.githubusercontent.com/SolidLabResearch/Solid-Agent/docs/readme-philips-hue/documentation/iot/Philips-hue%20demo.mp4)

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

### How does it work?

In this section, I will try to explain in a bit more detail what happens internally in the [DemoSolidAgent.ts](../../src/demo/DemoSolidAgent.ts). <br>
More specifically the flow of one update to the state of the Solid Pod of the End user is elaborated here.

1.  The **End user** updates the state resource on its **Solid pod** by sending an HTTP PUT request with an [RDF body](../../data/lights_on.ttl) describing how the lights must be actuated in the physical world.
    <!-- ```turtle
    @prefix saref: <https://saref.etsi.org/core/>.
    @prefix dbpedia: <http://dbpedia.org/resource/>.

    # The left light configured as orange color
    <urn:openhab:Bureau_links_Color> a saref:OnState ;
      dbpedia:Brightness 10 ;
      dbpedia:Colorfulness 50 ;
      dbpedia:Hue 0 .

    # The righ light configured as purple color
    <urn:openhab:Bureau_rechts_Color> a saref:OnState ;
      dbpedia:Brightness 10 ;
      dbpedia:Colorfulness 60 ;
      dbpedia:Hue 272 .
    ``` -->
2.  A notification is sent to the **Solid Agent** by the **Solid Pod of the End User** via a [Notification Channel](https://solidproject.org/TR/notifications-protocol#notification-channel).
    * More specifically the Notification Channel used is the [WebSocketChannel2023](https://solid.github.io/notifications/websocket-channel-2023).
3.  The **Solid Agent** fetches the state resource.
4.  The state resource is returned. Its RDF is passed as entry point to Koreografeye in the forms of an [ActivityStreams2 (AS2)](https://www.w3.org/TR/activitystreams-core/) `Announce` message. <!-- TODO: maybe add example? -->
5.  In the Solid Agent, a [Notation3 (N3)](https://w3c.github.io/N3/spec/) reasoner ([EyeJs](https://github.com/eyereasoner/eye-js)) is run with as input the AS2 message and the rules (defined in N3).
    * The rules used for the current configuration are `openHABChangedRule.n3`, `solidChangedRule.n3`, `orchestratorToOpenHAB.n3` and `orchestratorToSolid.n3` (which can be found in the [rules](../../rules/) directory).
6.  As a conclusion of this reasoning task, we get one Koreografeye Policy: a *hasStateChanged* policy.
    * In this case, it was the `solidChangedRule.n3` that got its premises matched.
7.  The *hasStateChanged* Plugin is executed. It compares the state retrieved from the **Solid Pod of the End User** with the state of the **Solid Agent**.
    * In this comparison, the subgraphs for each subject are compared. When a subgraph is not isomorph, a new AS2 `Announce` message is passed to the entry of Koreografeye. <!-- TODO: maybe add example? -->
8.  Again, the N3 reasoner is run with as input the AS2 message and the rules.
9.  This time we get the *updateOpenHABState* policy as a conclusion since it was the `orchestratorToOpenHAB.n3` rule that got its premises matched.
10. The *updateOpenHABState* Plugin is executed, which consists of two tasks
    *  Translate the RDF representation of the light to an openHAB item (done in this step).
    *  Send an authenticated POST request to the openHAB endpoint.
11. The **Solid Agent** sends the request to the openHAB endpoint to change the state of the item. <!-- TODO: maybe add example? -->

These steps are also visualised in the following UML sequence diagram:

![high level UML diagram](../../img/23-07-04_Philips-hue-solid(UML-high-level).png)

### Low-Level explanation

This section explains the initialisation of the [DemoSolidAgent.ts](../../src/demo/DemoSolidAgent.ts). <br>
Furthermore, an in-depth execution flow is given. This will make it clear that the execution *Condition Action* rules are implemented through [Koreografeye](https://github.com/eyereasoner/Koreografeye).


![low level UML diagram](../../img/23-07-04_Philips-hue-solid(UML-low-level).png)

Office checklist:

* openhab running
  ```sh
  # start openhab service local
  sudo systemctl start openhab.service
  ```
* wifi connected to knows_lights
* CSS set up
* solid agent running
