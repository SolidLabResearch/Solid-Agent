import { OpenHABAuthenticatedFetcher } from "./OpenHABAuthenticatedFetcher"

export interface Item {
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

export class OpenHABClient {
    private readonly accessToken: string;
    private readonly endPoint: string;
    private readonly fetcher: OpenHABAuthenticatedFetcher;

    // private items: string[];

    public constructor(config: { endPointUrl: string, accessToken: string }) {
        this.accessToken = config.accessToken;
        this.endPoint = config.endPointUrl; // todo: check if it ends on slash
        // this.items = config.itemNames;
        this.fetcher = new OpenHABAuthenticatedFetcher(this.accessToken)
    }

    // https://www.openhab.org/docs/configuration/websocket.html -> do later when polling is implemented


    private itemURL(itemName: string): string {
        return this.endPoint + 'rest/items/' + itemName;
    }

    /**
     * Read a thing that is present in the OpenHAB REST API
     * @param itemName
     * @returns {Item} - the item that is requested
     */
    public async readItem(itemName: string): Promise<Item> {
        const response = await this.fetcher.fetch(this.itemURL(itemName))


        if (response.status !== 200) {
            throw new Error(`Could not fetch item ${itemName}.`)
        }
        return response.json()
    }

    /**
     * Update the state of an item the openHAB REST API (https://www.openhab.org/docs/configuration/restdocs.html)
     * @param item - the item itself
     */
    public async setItem(item: Item): Promise<void> {
        const itemURL = this.itemURL(item.name)

        const response = await this.fetcher.fetch(itemURL, {
            method: "POST",
            headers: {
                'Content-Type': 'text/plain'
            },
            body: item.state
        });

        if (response.status !== 200) {
            throw new Error(`Could not update item ${item.name} to the following state: ${item.state}`)
        }
    }

    public async getItems(): Promise<Item[]>{
        const response = await this.fetcher.fetch(this.endPoint + 'rest/items')
        if (response.status !== 200) {
            throw new Error(`Could not fetch items.`)
        }
        return response.json()
    }
}
