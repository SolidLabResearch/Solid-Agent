import {OpenHABActor} from "../src/openHAB/OpenHABActor";
import {OpenHABClient} from "../src/openHAB/OpenHABClient";
import {OpenHABRDFTranslator} from "../src/openHAB/OpenHABRDFTranslator";
import {Writer} from "n3";
import {sleep, turtleStringToStore} from "@treecg/versionawareldesinldp";
require('dotenv').config()

const openHABURL = process.env.OPENHAB_URL
const openHABToken = process.env.OPENHAB_API_TOKEN
async function main(){
    const client = new OpenHABClient({endPointUrl:openHABURL!+'/', accessToken:openHABToken!})
    const translator = new OpenHABRDFTranslator();
    const actor = new OpenHABActor(client, translator)

    // get current quads
    const itemQuads = await actor.retrieveItem('Bureau_rechts_Color')
    const writer = new Writer()
    console.log(writer.quadsToString(itemQuads))

    // set purple hard coded
    let quadsString =`
    <Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OnState> .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 275 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 75 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 40 .
`
    let store = await turtleStringToStore(quadsString)
    await actor.storeItem(store.getQuads(null,null,null,null))

    await sleep(5000)
// turn off
    quadsString =`
    <Bureau_rechts_Color> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://saref.etsi.org/core/OffState> .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Hue> 275 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Colorfulness> 75 .
<Bureau_rechts_Color> <http://dbpedia.org/resource/Brightness> 0 .
`
    store = await turtleStringToStore(quadsString)
    await actor.storeItem(store.getQuads(null,null,null,null))

}
main()
