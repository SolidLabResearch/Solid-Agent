import {N3Support} from "@treecg/ldes-snapshot"
import {DataFactory, Store} from "n3";
import {RDF} from "@solid/community-server";
import {SOSA} from "../Vocabulary";
import {DCT} from "@treecg/versionawareldesinldp";
import namedNode = DataFactory.namedNode;

export interface IActuatableProperty extends N3Support {
    id: string
    description?: string
}

export class ActuatableProperty implements IActuatableProperty {
    private _id: string;
    private _description?: string;

    public constructor(id: string, optional?: {
        description?: string,
    }) {
        this._id = id;
        if (optional) {
            this._description = optional.description;
        }
    }

    get id(): string {
        return this._id;
    }

    get description(): string {
        return this._description ?? "";
    }

    getStore(): Store {
        const store = new Store()
        store.addQuad(namedNode(this.id), RDF.terms.type, SOSA.terms.FeatureOfInterest);
        if (this.description) store.addQuad(namedNode(this.id), DCT.terms.description, namedNode(this.description));
        return store;
    }
}
