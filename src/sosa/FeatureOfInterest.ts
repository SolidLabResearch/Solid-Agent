import {N3Support} from "@treecg/ldes-snapshot"
import {DataFactory, Store} from "n3";
import {RDF} from "@solid/community-server";
import {SOSA} from "../Vocabulary";
import {DCT} from "@treecg/versionawareldesinldp";
import namedNode = DataFactory.namedNode;

export interface IFeatureOfInterest extends N3Support {
    id: string
    description?: string
    title?: string

}

export class FeatureOfInterest implements IFeatureOfInterest {
    private _id: string;
    private _description?: string;
    private _title?: string;


    public constructor(id: string, optional?: {
        description?: string, title?: string
    }) {
        this._id = id;
        if (optional) {
            this._description = optional.description;
            this._title = optional.title;
        }
    }


    get id(): string {
        return this._id;
    }

    get description(): string {
        return this._description ?? "";
    }

    get title(): string {
        return this._title ?? "";
    }

    getStore(): Store {
        const store = new Store()
        store.addQuad(namedNode(this.id), RDF.terms.type, SOSA.terms.FeatureOfInterest);
        if (this.description) store.addQuad(namedNode(this.id), DCT.terms.description, namedNode(this.description));
        if (this.title) store.addQuad(namedNode(this.id), DCT.terms.title, namedNode(this.title));
        return store;
    }

}
