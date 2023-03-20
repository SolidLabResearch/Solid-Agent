import {EyeJsReasoner, EyeReasoner} from "koreografeye";
import {storeToString, turtleStringToStore} from "@treecg/versionawareldesinldp";

const ruleString = `@prefix as: <https://www.w3.org/ns/activitystreams#>.
@prefix pol:  <https://www.example.org/ns/policy#> .
@prefix fno:  <https://w3id.org/function/ontology#> .
@prefix ex:   <http://example.org/> .

{
  ?id a as:Announce .
  ?id as:actor <openHAB>.
} =>
{
  ex:MyDemoPolicy pol:policy [
    a fno:Execution ;
    fno:executes ex:hasStateChanged ; # function that checks whether internal state has changed. Creates an orchestrator announce request + updates state
    ex:param1 <solid>; # Target actor?
    ex:param2 "ResourceToKeepInSync"; # Resource that should be updated <http://localhost:3000/state> 
    ex:body ?id
  ] .
}.
`
const announcementString = `
<e5e37490-1ab8-4d9d-bc78-3466880cc4d3> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/ns/activitystreams#Announce> .
<e5e37490-1ab8-4d9d-bc78-3466880cc4d3> <https://www.w3.org/ns/activitystreams#actor> <openHAB> .
<e5e37490-1ab8-4d9d-bc78-3466880cc4d3> <https://www.w3.org/ns/activitystreams#object> <Bureau_rechts_Color> .
<Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 0 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 0 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 0 .
`

async function run() {
    const reasoner = new EyeJsReasoner([
        "--quiet" ,
        "--nope" ,
        "--pass"
    ])
    const reasonerEye = new EyeReasoner('/usr/local/bin/eye', [
        "--quiet" ,
        "--nope" ,
        "--pass"
    ])
    const resultString = await reasoner.reason(await turtleStringToStore(announcementString),[ruleString])
    console.log(storeToString(resultString))
    const attempt2 = await reasonerEye.reason(await turtleStringToStore(announcementString),[ruleString])
    console.log(storeToString(attempt2))
/*
Result contains `file:///` due to working with relative URIs :(
Can be fixed due to regex, but will be ugly
<file:///tmp/e5e37490-1ab8-4d9d-bc78-3466880cc4d3> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/ns/activitystreams#Announce> .
<file:///tmp/e5e37490-1ab8-4d9d-bc78-3466880cc4d3> <https://www.w3.org/ns/activitystreams#actor> <file:///tmp/openHAB> .
<file:///tmp/e5e37490-1ab8-4d9d-bc78-3466880cc4d3> <https://www.w3.org/ns/activitystreams#object> <file:///tmp/Bureau_rechts_Color> .
<file:///tmp/Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> .
<file:///tmp/Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 0 .
<file:///tmp/Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 0 .
<file:///tmp/Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 0 .
_:b1_sk_0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/function/ontology#Execution> .
_:b1_sk_0 <https://w3id.org/function/ontology#executes> <http://example.org/hasStateChanged> .
_:b1_sk_0 <http://example.org/param1> <file:///tmp/solid> .
_:b1_sk_0 <http://example.org/param2> "ResourceToKeepInSync" .
_:b1_sk_0 <http://example.org/body> <file:///tmp/e5e37490-1ab8-4d9d-bc78-3466880cc4d3> .
<http://example.org/MyDemoPolicy> <https://www.example.org/ns/policy#policy> _:b1_sk_0 .
*/
}
run()
