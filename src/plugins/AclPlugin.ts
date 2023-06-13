import {PluginFunction} from "../orchestration/OrchestrationActorInterface";
import {Store} from "n3";

export const fnoChangeAcl: PluginFunction = async function (event, actor, optional): Promise<void> {
    if (event.policy === undefined) throw Error()

    // Note: currently makes two shortcuts done for the demo use case at 21/06:
    //  1. The acl will be overwritten with the required ACL + control acl for the orchestration/solid actor
    //  2. default has not been decided on how to add that, so default will be ./ (in case the resource is a container/LDES)

    const aclStore = new Store()
    const aclAgent = event.policy.args['http://example.org/agent']!
    const mode = event.policy.args['http://example.org/mode']! // Note: currently only handles on of the modes at random, need a proper way to deal with this.
    const policyType = event.policy.args['http://example.org/policyType']!


}

/*
<urn:uuid:c4934284-06db-11ee-9769-df0aed819a51> pol:policy <urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33>.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> a fno:Execution.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> ex:agent <https://ruben.verborgh.org/profile/#me>.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> ex:mode acl:Read.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> ex:policyType ids:Permission.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> ex:target <https://tree.linkeddatafragments.org/sytadel/ldes/ais>.
<urn:uuid:c4934392-06db-11ee-b19f-979e56c2da33> fno:executes ex:changeAcl.*/
