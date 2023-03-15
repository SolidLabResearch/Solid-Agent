/**
 * map an item state object to an RDF representation of the said item
 * map an RDF representation of the state of an item to an item state object
 */
import {Item} from "./OpenHABClient";
import {DataFactory, Quad, Store, Writer} from "n3";
import namedNode = DataFactory.namedNode;
import quad = DataFactory.quad;
import {DBR, SAREF} from "../Vocabulary";
import {RDF} from "@solid/community-server";
import literal = DataFactory.literal;
import {QueryEngine} from "@comunica/query-sparql";

export class OpenHABRDFTranslator {
    private queryEngine: QueryEngine;

    public constructor(queryEngine?: QueryEngine) {
        this.queryEngine = queryEngine ?? new QueryEngine();
    }

    /**
     * Currently can only generate RDF for color items
     * @param item
     */
    public translateItemToRDF(item: Item): Quad[] {
        const quads: Quad[] = []
        // TODO: maybe later add label?
        switch (item.type) {
            case 'color':
                const state = parseColorState(item.state)
                const idTerm = namedNode(item.name)
                const type = state.onOff ? SAREF.terms.OnState : SAREF.terms.OffState
                quads.push(quad(idTerm, RDF.terms.type, type))
                quads.push(quad(idTerm, DBR.terms.Hue, literal(state.hue)))
                quads.push(quad(idTerm, DBR.terms.Colorfulness, literal(state.saturation)))
                quads.push(quad(idTerm, DBR.terms.Brightness, literal(state.brightness)))
                break;
            default:
                throw Error('Can not handle this type.')
        }
        return quads
    }

    /**
     * Currently can only handle changing color to item.
     * @param quads
     * @param identifier
     */
    public async translateRDFToItem(quads: Quad[], identifier: string): Promise<Item> {
        const store = new Store(quads)
        const item: Item = {
            editable: false,
            groupNames: [],
            link: "",
            name: "",
            state: undefined,
            tags: [],
            type: ""
        }
        // function that extracts all quads with the id

        // function that can detect type
        const type = 'color'
        switch (type) {
            case "color":
                item.state = await createColorState(quads, this.queryEngine)
                break;
            default:
                throw Error("Not implemented yet.")
        }
        return item
    }
}

/**
 * Transform the state of an openHAB item of type `color` to hue, saturation, brightness values
 * @param state
 * @return {{saturation: number, brightness: number, hue: number, onOff: boolean}}
 */
function parseColorState(state: string) {
    const stateValues = state.split(',');
    const hue = Number(stateValues[0]) // values between 0-360
    const saturation = Number(stateValues[1]) // values between 0-100
    const brightness = Number(stateValues[2]) // values between 0-100
    const onOff = brightness !== 0
    return {
        hue, saturation, brightness, onOff
    }
}

/**
 * Transform the RDF graph of the state of an openHAB item of type 'color' to the string state `{hue},{saturation},{brightness}`
 *
 * Note: not yet known what takes precedence if brightness is 0 -> saref:on/off state or brightness itself
 * @param quads
 * @param queryEngine
 */
async function createColorState(quads: Quad[], queryEngine: QueryEngine): Promise<string> {
    const queryBody = `
    ?id a ?state;
        <${DBR.Hue}> ?hue;
        <${DBR.Colorfulness}> ?saturation;
        <${DBR.Brightness}> ?brightness;
`
    const bindingsStream = await queryEngine.queryBindings(`
    SELECT * WHERE {
    ${queryBody}
  } LIMIT 100`, {
        sources: [new Store(quads)],
    });
    const bindings = await bindingsStream.toArray();
    if (bindings.length === 0) throw Error("No color found for item.")
    const hue = bindings[0].get('hue')
    const saturation = bindings[0].get('saturation')
    const brightness = bindings[0].get('brightness')
    if (hue === undefined) throw Error("Could not find Hue value in RDF.")
    if (saturation === undefined) throw Error("Could not find Saturation value in RDF.")
    if (brightness === undefined) throw Error("Could not find Brightness value in RDF.")
    return `${hue.value},${saturation.value},${brightness.value}`
}

// // Code that test whether a very simplified example works -> needs better tests and more error handling
// const test = new OpenHABRDFTranslator()
// const quads = test.translateItemToRDF({
//     name: 'Bureau_rechts_Color', state: '275,75,1',
//     link: '',
//     editable: false,
//     type: 'color',
//     tags: [],
//     groupNames: []
// })
// const writer = new Writer()
// console.log(writer.quadsToString(quads))
// test.translateRDFToItem(quads, 'Bureau_rechts_Color').then( item =>
// console.log(item))
