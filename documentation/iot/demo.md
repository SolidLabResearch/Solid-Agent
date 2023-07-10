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

![TODO: film and maybe edit video]()

In this screencast, you see ... windows:

* https://www.dev47apps.com/obs/usage.html

At any time the state can be checked both at the state resource or at the openhab API
* webcam laptop: two lamps - desk lamp left and desk lamp right
* terminal: where I send the curl requests
* browser: solid resource
* browser: openhab?



Office checklist:

* openhab running
  ```sh
  # start openhab service local
  sudo systemctl start openhab.service
  ```
* wifi connected to knows_lights
* CSS set up
* solid agent running
