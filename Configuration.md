# Minimum amount of fields for configuration

This is based of the first Hue-flow

## App configuration

Consists of a configuration that can generate all other components

* third party parameters
  * third party app ID (id to the configuration)
  * endpointURL: base URL for the endpoint
  * credentials for the third party (or link to file that contains credentials)
* solid parameters
  * URL: specific container/ state resource?
  * communication specific parameters (if none given, default to something)

## Third party app specific configuration

* Which receiver implementation to use
  * the implementation itself (maybe componentjs or something)
  * the parameters for the constructor
* RML file to map incoming data to RDF
* Configuration on how to map RDF to action
* Which transmitter implementation to use
  * the implementation itself
  * the parameters for the constructor

## Always there solid configuration

* URL of the state resource
* parameters on how to receive
  * pull-based
    * frequency: which interval to pol with
  * push-based

## Processor configuration

* rules
  * what to do with incoming events?
    * The rules contain links to the 3rd party app endpoint and the solid state endpoint