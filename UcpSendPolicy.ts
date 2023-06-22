function makePolicy({
                        webID = 'https://woslabbi.pod.knows.idlab.ugent.be/profile/card#me',
                        duration = "PT30S",
                        resource = "http://localhost:3000/ldes",
                        log = false
                    }) {
    const message =
        `@prefix : <http://example.org/socrates#>.
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix ids: <https://w3id.org/idsa/core/> .
@prefix idsc: <https://w3id.org/idsa/code/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://w3id.org/idsa/autogen/permission/3b1439a1-4136-4675-b5a0-798ec3148996>
a <https://w3id.org/idsa/core/Permission> ;
ids:action <https://w3id.org/idsa/code/USE> ;
ids:constraint <https://w3id.org/idsa/autogen/constraint/b7d8beaf-0765-4d40-b2e9-4eddeda1c89b> ;
ids:description "duration-usage"^^xsd:string ;
ids:target <${resource}> ;
odrl:assignee <${webID}> ;
ids:title "Example Usage Policy"^^xsd:string .

<https://w3id.org/idsa/autogen/constraint/b7d8beaf-0765-4d40-b2e9-4eddeda1c89b>
a ids:Constraint ;
ids:leftOperand <https://w3id.org/idsa/code/ELAPSED_TIME> ;
ids:operator <https://w3id.org/idsa/code/SHORTER_EQ> ;
ids:rightOperand "${duration}"^^xsd:duration .`
    if (log) {
        console.log(message)
    }
    return message
}

async function sendPolicy() {
    // const webID = 'https://woslabbi.pod.knows.idlab.ugent.be/profile/card#me'
    const webID = "https://woutslabbinck.solidcommunity.net/profile/card#me"
    const duration = "PT30S"
    const resource = "http://localhost:3000/ldes"
    const policyStorage = "http://localhost:3000/policies/"
    const idsaPolicy = makePolicy({webID, duration, resource})

    const response = await fetch(policyStorage, {
        method: "POST",
        headers: {
            "content-type":"text/turtle"
        },
        body: idsaPolicy
    })
    if (response.status === 201){
        console.log(`${new Date().toISOString()} Duration policy: ${webID} now has access to ${resource} for ${duration}`)
    } else {
        console.log(`${new Date().toISOString()} Duration policy: failed to POST duration policy to ${policyStorage}`)

    }
}

sendPolicy()
