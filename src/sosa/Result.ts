import {N3Support} from "@treecg/ldes-snapshot";
import {DataFactory, Store} from "n3";
import {RDF} from "@solid/community-server";
import {SOSA} from "../Vocabulary";
import namedNode = DataFactory.namedNode;

export interface IResult extends N3Support {
    id: string
}

export class Result implements IResult {
    private _id: string;


    public constructor(id: string) {
        this._id = id;
    }

    public get id(): string {
        return this._id;
    }

    public getStore(): Store {
        const store = new Store();
        store.addQuad(namedNode(this.id), RDF.terms.type, SOSA.terms.Result);
        return store
    }


}
