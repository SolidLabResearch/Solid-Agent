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

export class openHABAgent {
    private readonly accessToken: string;
    private readonly endPoint: string;
    private readonly fetcher: OpenHABAuthenticatedFetcher;

    private items: string[];

    public constructor(config: { endPointUrl: string, accessToken: string, itemNames: string[] }) {
        this.accessToken = config.accessToken;
        this.endPoint = config.endPointUrl;
        this.items = config.itemNames;
        this.fetcher = new OpenHABAuthenticatedFetcher(this.accessToken)
    }

    // https://www.openhab.org/docs/configuration/websocket.html -> do later when polling is implemented

    private itemURL(itemName: string): string {
        return this.endPoint + 'rest/items/' + itemName;
    }

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
            headers: {
                'Content-Type': 'text/plain'
            },
            body: item.state
        });

        if (response.status !== 200) {
            throw new Error(`Could not update item ${item.name} to the following state: ${item.state}`)
        }
    }
}