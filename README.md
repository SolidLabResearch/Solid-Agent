# Solid Agent

The Solid Agentis rule-based intelligent software agent.
It consists of a network of different actors working together.
Each actor is (part of) a component of the **hybrid web agent architecture** proposed in [Intelligent software web agents: A gap analysis](https://www.sciencedirect.com/science/article/pii/S1570826821000342) by Sabrina Kirrane.
The five components proposed in that architecture are the following:
* Interface component: This component communicates with the environment. It can both _sense_ and _actuate_. The basis communication protocol is HTTP as it is a web agent.
* Reactive component: This component consists of Condition-Action-Rules. As input it uses a Condition and it retuns an Action based on the set of rules.
* Deliberative component: Takes in a goal and as output an action. This is not implemented yet as the Solid Agent does not support goal encoding.
* Learning component: A component that can learn from past experiences to become more effective over time. The Solid Agent does not contain any learning elements yet.
* Controller component: Responsible for interpreting the perceptions from the sensors and passing them to another component (e.g. reactive or deliberative) that can handle such an event.
  As a result, it retrieves an action/execution plan. Which it then executes through an execution engine, which might be passed back to the environment via the _actuate_ in the Interface component.

The Solid Agent consists of multiple independent actors that each implement one or more of these components to form a Minimum Viable Product of a configurable **hybrid web agent**.
Currently, the following actors are implemented:

<!--
* The **Orchestration Actor**:
  * _Controller component_: Each time an event comes in, through one of the sensing actors, the event is passed to the reactive component.
    When there is a conclusion, it will be executed by the **Policy Executer**
  * _Reactive component_: condition-action rules are defined in the set of **n3 Rules**. 
    Each time an event comes in, the **reasoning engine** is run using both the given event, the set of rules.
    An action would be the conclusion, which in Koreografeye would be a policy to be executed.
  * _Interface component_
* The **openHAB Actor**:
  * _Interface component_
* The **Solid Actor**:
  * _Interface component_
!-->

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


A complete overview of the current Solid Agent Architecture can be seen in following figure.

![Agent Architecture](./img/23-07-04_Philips-hue-solid(Architecture).png)

It is clear that the agent consists of different components that each can stand on their own.
This is done to improve modularity and for future research into Multi-Agent Systems. 
At the moment each actor can be seen as a standalone agent itself with a simple goal. 
Multiple combinations and configurations allows for a multitude of use cases to be prototyped.


## Use cases

Currently, three use cases have been worked out and configured:

* Synchronising the state Smart Home with a personal data store
* Temporal Usage Control Policy execution for Solid Resources
* The Solid RDF Resource Synchronisation Use Case

### Synchronising the state Smart Home with a personal data store

TODO: elaborate

[More information](./documentation/iot)

### Temporal Usage Control Policy execution for Solid Resources

TODO: elaborate

[More information](./documentation/ucp)

### The Solid RDF Resource Synchronisation Use Case

TODO: elaborate 

## Feedback and questions

Do not hesitate to [report a bug](https://github.com/SolidLabResearch/Solid-Agent/issues).

Further questions can also be asked to [Wout Slabbinck](mailto:wout.slabbinck@ugent.be) (developer and maintainer of this repository) or [Patrick Hochstenbach](mailto:Patrick.Hochstenbach@UGent.be) (developer and maintainer of [Koreografeye](https://github.com/eyereasoner/Koreografeye)).
