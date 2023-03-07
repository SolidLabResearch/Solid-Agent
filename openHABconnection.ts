// Code to test the connection to openHAB stuff
// import {config} from 'dotenv'
import { OpenHABClient } from './src/openHAB/OpenHABAgent'
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

async function main() {
    const openHAB = new OpenHABClient({ endPointUrl: openHABURL! + '/', accessToken: openHABToken! })
    let lamp = await openHAB.readItem('Bureau_rechts_Color')
    console.log(lamp);

    // set purple
    await openHAB.setItem({
        name: 'Bureau_rechts_Color', state: '269,30,11.5',
        link: '',
        editable: false,
        type: '',
        tags: [],
        groupNames: []
    })
    // set on
    await openHAB.setItem({
        name: 'Bureau_rechts_Color', state: 'ON',
        link: '',
        editable: false,
        type: '',
        tags: [],
        groupNames: []
    })
    console.log('should be on and purple');
    lamp = await openHAB.readItem('Bureau_rechts_Color')
    console.log(lamp);
    await sleep(5000)
    // set off again
    await openHAB.setItem({
        name: 'Bureau_rechts_Color', state: 'OFF',
        link: '',
        editable: false,
        type: '',
        tags: [],
        groupNames: []
    })
    await sleep(5000)
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