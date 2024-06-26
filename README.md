# Solid Agent

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.8338025.svg)](https://doi.org/10.5281/zenodo.8338025)


The Solid Agent is a rule-based intelligent software agent.
It consists of a network of different actors working together.
Each actor is (part/combination of) a component of the **hybrid web agent architecture** proposed in [Intelligent software web agents: A gap analysis](https://www.sciencedirect.com/science/article/pii/S1570826821000342) by Sabrina Kirrane.
The five components proposed in that architecture are the following:
* **Interface component**: This component communicates with the environment. It can both _sense_ and _actuate_. The basis communication protocol is HTTP as it is a web agent.
* **Reactive component**: This component consists of Condition-Action-Rules. As input, it uses a Condition and it returns an Action based on the set of rules.
* **Deliberative component**: Takes in a goal and as output an action. This is not implemented yet as the Solid Agent does not support goal encoding.
* **Learning component**: A component that can learn from past experiences to become more effective over time. The Solid Agent does not contain any learning elements yet.
* **Controller component**: Responsible for interpreting the perceptions from the sensors and passing them to another component (e.g. reactive or deliberative) that can handle such an event.
  As a result, it retrieves an action/execution plan. It then executes through an execution engine, which might be passed back to the environment via the _actuate_ in the Interface component.

The Solid Agent consists of multiple independent actors that each implement one or more of these components to form a Minimum Viable Product of a configurable **hybrid web agent**.
Currently, the following actors are implemented:

* The **Orchestration Actor**:
  * _Controller component_: A component that passes events to the _reactive component_.
    When a conclusion (action to be taken) is retrieved from the _reactive component_, 
    it processes the action and executes it, possibly by passing instructions to other actors so it can be enacted in the environment of the agent.
  * _Reactive component_: A component that handles events by reasoning over them with **condition-action** rules.
  * _Interface component_: A component that deals with interactions with the environment.
   It is used to configure the **Orchestration Actor** and communicate with other actors within the network.
* The **openHAB Actor**:
  * _Interface component_: A component that deals with interactions with the environment.
    It is used to communicate with other actors within the network and to interact with the openHAB platform through its API.
* The **Solid Actor**:
  * _Interface component_: A component that deals with interactions with the environment.
    It is used to communicate with other actors within the network and to interact with the Solid pods through the Solid Protocol.


A complete overview of the current Solid Agent Architecture can be seen in the following figure.

![Agent Architecture](./img/23-09-12_Philips-hue-solid(Architecture).png)

The agent consists of different components that each can stand on their own.
This is done to improve modularity and for future research into **Multi-Agent Systems** (MAS). 
At the moment each actor can be seen as a standalone agent itself with a simple goal. 
Multiple combinations and configurations allow for a multitude of use cases to be prototyped.
``

## Use cases

Currently, three use cases have been worked out and configured:

- [Solid Agent](#solid-agent)
  - [Use cases](#use-cases)
    - [Synchronising the state Smart Home with a personal data store](#synchronising-the-state-smart-home-with-a-personal-data-store)
    - [Temporal Usage Control Policy execution for Solid Resources](#temporal-usage-control-policy-execution-for-solid-resources)
    - [The Solid RDF Resource Synchronisation Use Case](#the-solid-rdf-resource-synchronisation-use-case)
  - [Cite](#cite)
  - [Feedback and questions](#feedback-and-questions)

### Synchronising the state Smart Home with a personal data store

The Solid Protocol, an example of a personal data store, defines how to interact with a Solid pod.
To integrate a Smart Home system with Solid, there are a couple of options: 
1. Use a reference implementation (e.g. the [CSS](https://github.com/CommunitySolidServer/CommunitySolidServer) or the [NNS](https://github.com/nodeSolidServer/node-solid-server)) and transform the code so the server speaks to the Smart Home Devices directly
   * While technically possible, this results in a vendor lock-in. When people want to use a Smart Home solution with Solid, they have to use this specific Solid Server implementation. And this is against the idea of the Solid Protocol: It doesn't matter what server you use. As long as this server follows the protocol, interoperability is guaranteed.
2. An application can be built that implements smart home integration and the Solid Protocol
   * The problem here lies in the **availability**. As soon as you are not running the application, the integration will stop.

A third option is to use an **Intelligent Software Web Agent**, which is what we have done here. <br>
We have created an openHAB actor so that the **Solid Agent** can be configured to synchronize the state with the [openHAB](https://www.openhab.org/) platform and a state resource stored on a Solid pod.<br>
More information on how to run the agent yourself and how it's built can be found [here](./documentation/iot/README.md).

### Temporal Usage Control Policy execution for Solid Resources


Sharing data with other people, apps, and other agents is common in the Solid ecosystem. 
But you might not always want to share the data forever. 
You might want to share specific data for a limited amount of time. 

For this reason, the **Solid Agent** is configured to allow end users to give temporary access to a Solid resource.<br>
More information on how to run the agent yourself and how it's built can be found [here](./documentation/ucp/README.md).

### The Solid RDF Resource Synchronisation Use Case

The Solid Agent is configured to copy the contents of an RDF resource to another RDF resource. <br>
See [DemoSyncAgent](./src/demo/DemoSyncAgent.ts) for more information.


## Cite

If you are using or extending the Solid Agent as part of a scientific publication,
we would appreciate a citation of our [article](https://ceur-ws.org/Vol-3632/ISWC2023_paper_406.pdf).

```bibtex
@inproceedings{slabbinck_iswc_demo_2023,
  author = {Slabbinck, Wout and Dedecker, Ruben and Rojas Mel\'endez, Juli\'an Andr\'es and Verborgh, Ruben},
  title = {A Rule-Based Software Agent on Top of Personal Data Stores},
  booktitle = {Proceedings of the 22nd International Semantic Web Conference: Posters, Demos, and Industry Tracks},
  year = 2023,
  month = nov,
}
```

## Feedback and questions

Do not hesitate to [report a bug](https://github.com/SolidLabResearch/Solid-Agent/issues).

Further questions can also be asked to [Wout Slabbinck](mailto:wout.slabbinck@ugent.be) (developer and maintainer of this repository) or [Patrick Hochstenbach](mailto:Patrick.Hochstenbach@UGent.be) (developer and maintainer of [Koreografeye](https://github.com/eyereasoner/Koreografeye)).
