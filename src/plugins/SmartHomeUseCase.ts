import {Event, PluginFunction} from "../agent/OrchestrationActorInterface";
import {extractItem, hasChanged, updateState} from "../agent/Util";
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
    if (optional.stream === undefined) throw Error()

    const policy = event.policy;
    const state = await actor.readResource("state")
    const stream = optional.stream;

    const updatedState = updateState(state, event.data)

    // check if state is updated
    if (hasChanged(updatedState, state)) {
        console.log(`${new Date().toISOString()} [fnoHasStateChanged] Received event from ${event.from} actor: state was changed, so sending message to myself (orchestrator) now.`)
        // make new event for orchestrator
        const uuid = uuidv4()
        const targetActor = policy.args['http://example.org/param1']!.value
        const targetLocation = policy.args['http://example.org/param2']!.value

        const fromActor = 'orchestrator' // TODO: need to properly pass orchestrator to this function + must be real webid
        const fromLocation = "state"

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
            resourceURL: fromLocation
        }
        // update state here (instead of in other two plugin functions)
        await actor.writeResource(fromLocation, updatedState)
        // push new event to stream
        stream.push(newEvent) // TODO: edit orchestrator actor writeresource to add an event?
    } else {
        console.log(`${new Date().toISOString()} [fnoHasStateChanged] Received event from ${event.from} actor: No change detected.`)
    }

}
/**
 * Updates the state of the orchestration agent with the data of the event
 * Sends an action to the openHAB actor to the items based on the state.
 * @param event
 * @param actor
 * @param optional
 */
export const fnoUpdateOpenHABState: PluginFunction = async function (event, actor, optional): Promise<void> {
    if (event.policy === undefined) throw Error()

    const targetActor = event.policy.args[AS.namespace +'target']!.value
    const targetLocation = event.policy.args[AS.namespace +'to']!.value
    for (const resource of actor.resources) {
        const itemQuads = extractItem(event.data, resource);
        actor.writeResource(resource, itemQuads)
        console.log(`${new Date().toISOString()} [fnoUpdateOpenHABState] Received event from ${event.from} actor: start updating state in ${targetActor} actor to location ${targetLocation} for resource ${resource}.`)

    }
}
/**
 * Updates the state of the orchestration agent with the data of the event
 * Sends an action to the solid actor to the items based on the state.
 * @param event
 * @param actor
 * @param optional
 */
export const fnoUpdateSolidState: PluginFunction = async function (event, actor, optional): Promise<void> {
    if (event.policy === undefined) throw Error()

    const targetActor = event.policy.args[AS.namespace +'target']!.value
    const targetLocation = event.policy.args[AS.namespace +'to']!.value
    console.log(`${new Date().toISOString()} [fnoUpdateSolidState] Received event from ${event.from} actor: start updating state in ${targetActor} actor to location ${targetLocation}.`)
    actor.writeResource(targetLocation, event.data)
}
