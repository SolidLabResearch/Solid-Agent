// Code to test the connection to openHAB stuff
// import {config} from 'dotenv'
import { Item, OpenHABClient } from './src/openHAB/OpenHABClient'
import { OpenHABAuthenticatedFetcher } from './src/openHAB/OpenHABAuthenticatedFetcher'
require('dotenv').config()

const openHABURL = process.env.OPENHAB_URL
const openHABToken = process.env.OPENHAB_API_TOKEN

if (!openHABURL) {
    throw new Error('No openHAB API token or endpoint')
}

if (!openHABToken) {
    throw new Error('No openHAB endpoint')
}

const fetcher = new OpenHABAuthenticatedFetcher(openHABToken)

async function old_main() {
    const lightItem = 'Alllights'
    const response = await fetcher.fetch(`${openHABURL}/rest/items/${lightItem}?recursive=true`)
    console.log(await response.json());
    console.log(response.status);

    // const response = await fetcher.fetch(itemAPI(openHABURL!))
    // const openHABNames: Thing[] = await response.json()
    // openHABNames.forEach(({name, type})=> console.log(name + " " +type));    
}

async function turnLampOn(color: string, openHABClient: OpenHABClient){
    let state = ''
    const item: Item =         {
            name: 'Bureau_rechts_Color', state: state,
            link: '',
            editable: false,
            type: '',
            tags: [],
            groupNames: []
        }
    
    switch (color){
        case 'cyan':
            state = '175,50,40'  
            break;
        case 'blue':
            state = '226,50,40'  
            break;
        case 'red':
            state = '0,50,40'  
            break;
        case 'yellow':
            state = '62,50,40'  
            break;
        case 'purple':
            state = '275,50,40'  
            break;
        default:
            state = '52,50,40'    
    }
    item.state = state
    
    await openHABClient.setItem(item)

}

async function turnLampOff(openHABClient: OpenHABClient) {
    const item: Item =         {
        name: 'Bureau_rechts_Color', state: "OFF",
        link: '',
        editable: false,
        type: '',
        tags: [],
        groupNames: []
    }
    await openHABClient.setItem(item)

}
async function main() {
    const openHAB = new OpenHABClient({ endPointUrl: openHABURL! + '/', accessToken: openHABToken! })
    let lamp = await openHAB.readItem('Bureau_rechts_Color')
    console.log(`current color: ${lamp.state}`);
    // // set on
    // await openHAB.setItem({
    //     name: 'Bureau_rechts_Color', state: 'ON',
    //     link: '',
    //     editable: false,
    //     type: '',
    //     tags: [],
    //     groupNames: []
    // })

    // // set purple
    // await openHAB.setItem({
    //     name: 'Bureau_rechts_Color', state: '275,75,40',
    //     link: '',
    //     editable: false,
    //     type: '',
    //     tags: [],
    //     groupNames: []
    // })

    // console.log('should be on and purple');
    // lamp = await openHAB.readItem('Bureau_rechts_Color')
    // console.log(`current color: ${lamp.state}`);

    await turnLampOn("asdf", openHAB)
    await sleep(5000)
    // set off again
    console.log('Turning lamp off.');
    await openHAB.setItem({
        name: 'Bureau_rechts_Color', state: 'OFF',
        link: '',
        editable: false,
        type: '',
        tags: [],
        groupNames: []
    })
}
main()

export function sleep(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function itemAPI(openHABURL: string, itemName?: string): string {
    itemName = itemName ?? ''
    return openHABURL + '/rest/items/' + itemName
}
interface Thing {
    members?: string[]
    link: string
    state: any
    stateDescription?: any
    editable: boolean
    type: string
    name: string
    label?: string
    category?: string
    tags: string[]
    groupNames: string[]
}