import {PluginFunction} from "../orchestration/OrchestrationActorInterface";
import {DataFactory, Quad_Object, Store} from "n3";
import {ACL, RDF} from "@solid/community-server";
import {IDSA} from "../Vocabulary";
import namedNode = DataFactory.namedNode;

export const fnoChangeAcl: PluginFunction = async function (event, actor, optional): Promise<void> {
    if (event.policy === undefined) throw Error()

    // Note: currently makes two shortcuts done for the demo use case at 21/06:
    //  1. The acl will be overwritten with the required ACL + control acl for the orchestration/solid actor
    //  2. default has not been decided on how to add that, so default will be ./ (in case the resource is a container/LDES)
    const aclStore = new Store()
    // WAC, §4.3: "The `acl:agent` predicate denotes an agent being given the access permission."
    // https://solid.github.io/web-access-control-spec/#access-subjects
    const aclAgent = event.policy.args['http://example.org/agent']!
    // WAC, §4.3: "The `acl:mode` predicate denotes a class of operations that the agents can perform on a resource."
    // https://solid.github.io/web-access-control-spec/#access-modes
    const mode = event.policy.args['http://example.org/mode']! // Note: currently only handles on of the modes at random, need a proper way to deal with this.
    // WAC, §4.1: "The `acl:accessTo` predicate denotes the resource to which access is being granted"
    // https://solid.github.io/web-access-control-spec/#access-objects
    const resource = event.policy.args['http://example.org/target']!
    // The deontic concept: `ids:Permission` or `ids:Prohobition`
    const policyType = event.policy.args['http://example.org/policyType']!
    // ACL resource URL
    const aclResourceURL = resource.value + '.acl'

    // control ACL for agent
    const agentAuthorization = namedNode(aclResourceURL + '#AgentAuthorization') // hash value should be uuid in future?
    aclStore.addQuad(agentAuthorization, RDF.terms.type, ACL.terms.Authorization)
    aclStore.addQuad(agentAuthorization, ACL.terms.agent, namedNode(actor.webID))
    aclStore.addQuad(agentAuthorization, ACL.terms.mode, ACL.terms.Control)
    aclStore.addQuad(agentAuthorization, ACL.terms.accessTo, resource as Quad_Object)
    aclStore.addQuad(agentAuthorization, ACL.terms.default, resource as Quad_Object)

    // ACL generated through Koreografeye Policy
    switch (policyType.value) {
        case IDSA.Permission:
            const policyAuthorization = namedNode(aclResourceURL+ "PolicyAuthorization") // hash value should be uuid in future?
            aclStore.addQuad(policyAuthorization, RDF.terms.type, ACL.terms.Authorization)
            aclStore.addQuad(policyAuthorization, ACL.terms.agent, aclAgent as Quad_Object)
            aclStore.addQuad(policyAuthorization, ACL.terms.mode, mode as Quad_Object)
            aclStore.addQuad(policyAuthorization, ACL.terms.accessTo, resource as Quad_Object)
            aclStore.addQuad(policyAuthorization, ACL.terms.default, resource as Quad_Object)
            break;
        case IDSA.Prohibition:
            break;
        default:
            throw Error(`fnoChangeAcl cannot deal with following policy Type: ${policyType.value}`)
    }

    await actor.writeResource(aclResourceURL, aclStore.getQuads(null, null, null, null))
    console.log(`${new Date().toISOString()} [fnoChangeAcl] ACL for resource ${resource.value} updated.`)

}

/*
<urn:uuid:c4934284-06db-11ee-9769-df0aed819a51> pol:policy <urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33>.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> a fno:Execution.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> ex:agent <https://ruben.verborgh.org/profile/#me>.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> ex:mode acl:Read.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> ex:policyType ids:Permission.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> ex:target <https://tree.linkeddatafragments.org/sytadel/ldes/ais>.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> fno:executes ex:changeAcl.*/
