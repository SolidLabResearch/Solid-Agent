import {Event, PluginFunction} from "../agent/OrchestrationActorInterface";
import {hasChanged, updateState} from "../agent/Util";
import {RDF} from "@solid/community-server";
import {AS} from "../Vocabulary";
import {DataFactory} from "n3";
import {v4 as uuidv4} from "uuid";
import quad = DataFactory.quad;
import namedNode = DataFactory.namedNode;

/**
 * Checks whether the data from the event is isomorphic with state.
 * When it is not isomorphic, the data has changed, so an event is added to stream with an announcement to update an actor.
 * The updating of the actor is based on the policy.
 * @param event
 * @param actor
 * @param optional
 */
export const fnoHasStateChanged: PluginFunction = async function (event, actor, optional): Promise<void> {
    if (event.policy === undefined) throw Error()
    if (optional === undefined) throw Error()
    if (optional.state === undefined) throw Error()
    if (optional.stream === undefined) throw Error()

    const policy = event.policy;
    const state = optional.state;
    const stream = optional.stream;

    const updatedState = updateState(state, event.data)

    // check if state is updated
    if (hasChanged(updatedState, state)) {
        console.log(`${new Date().toISOString()} [${fnoHasStateChanged.name}] Received event from ${event.from} actor: state was changed, so sending message to myself now.`)
        // make new event for orchestrator
        const uuid = uuidv4()
        const targetActor = policy.args['http://example.org/param1']!.value
        const targetLocation = policy.args['http://example.org/param2']!.value
        const fromActor = 'orchestrator' // TODO: need to properly pass orchestrator to this function + must be real webid

        const announcement = [
            quad(namedNode(uuid), RDF.terms.type, AS.terms.Announce),
            quad(namedNode(uuid), AS.terms.actor, namedNode(fromActor)),
            quad(namedNode(uuid), AS.terms.target, namedNode(targetActor)),
            quad(namedNode(uuid), AS.terms.to, namedNode(targetLocation)),
        ]
        const newEvent: Event = {
            activity: [...announcement, ...updatedState],
            data: updatedState,
            from: fromActor,
            resourceURL: "stateURL" // TODO: clarify
        }
        // push new event to stream
        stream.push(newEvent)
    } else {
        console.log(`${new Date().toISOString()} [${fnoHasStateChanged.name}] Received event from ${event.from} actor: No change detected.`)
    }

}

// TODO: implement other functions here as well

export const fnoUpdateOpenHABState: PluginFunction = async function (event, actor, optional): Promise<void> {
    if (event.policy === undefined) throw Error()
    if (optional === undefined) throw Error()
    if (optional.state === undefined) throw Error()
    if (optional.stream === undefined) throw Error()

    const targetActor = event.policy.args[AS.namespace +'target']!.value
    const targetLocation = event.policy.args[AS.namespace +'to']!.value
    optional.state = event.data // TODO: make sure state can be updated!
    console.log(`${new Date().toISOString()} [${fnoUpdateOpenHABState.name}] Received event from ${event.from} actor: start updating state in ${targetActor} actor to location ${targetLocation}.`)

}

export const fnoUpdateSolidState: PluginFunction = async function (event, actor, optional): Promise<void> {
    if (event.policy === undefined) throw Error()
    if (optional === undefined) throw Error()
    if (optional.state === undefined) throw Error()
    if (optional.stream === undefined) throw Error()

    const targetActor = event.policy.args[AS.namespace +'target']!.value
    const targetLocation = event.policy.args[AS.namespace +'to']!.value
    optional.state = event.data // TODO: make sure state can be updated!
    console.log(`${new Date().toISOString()} [${fnoUpdateSolidState.name}] Received event from ${event.from} actor: start updating state in ${targetActor} actor to location ${targetLocation}.`)
}
