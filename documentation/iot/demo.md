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

To demonstrate this configuration of the Solid Agent, the following steps must be executed:l

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
5.   Update the left light by sending a request to openhab directly
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
When the server is running, the Solid Agent is started. It listens PULL-based to the openHAB items (polling every 5 seconds) and PUSH-based to the state resource on the CSS (`http://localhost:3000/state`) by listening via a WebSocket (using the [Solid Notification Protocol](https://solidproject.org/TR/notifications-protocol)).
Now, the environment is ready, so we send an update (PUT) HTTP request to the state resource with as body [RDF to turn the lights on (left red and right purple)](../../data/lights_on.ttl). 
The Solid Agent receives a notification that the state resource has changed, so it sends two requests to indeed turn the lights on with the given configuration.
Next, a similar request is sent to the state resource. This time, however, it is an update request to turn the lights off. Which, thanks to the Solid Agent, leads to the lights being shut off again.
To show that the Solid Agent is also configured properly in the other direction, a request to the left light is send to the openHAB API to turn it on.
And we can see that it is updated (Penny window) and the left light indeed turns on.
Finally, the lights are turned Off by updating the state resource again.

Office checklist:

* openhab running
  ```sh
  # start openhab service local
  sudo systemctl start openhab.service
  ```
* wifi connected to knows_lights
* CSS set up
* solid agent running
