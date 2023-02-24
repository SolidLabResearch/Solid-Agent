import {RDF} from "@solid/community-server";
import {N3Support} from "@treecg/ldes-snapshot";
import {DataFactory, Store} from "n3";
import {SOSA} from "../Vocabulary";
import {IActuation} from "./Actuation";

const namedNode = DataFactory.namedNode
export interface IActuator extends N3Support {
    id: string
    actuations: IActuation[]
}

export class Actuator implements IActuator {
    private _id: string;
    private _actuations: IActuation[];

    public constructor(id: string, actuations?: IActuation[]) {
        this._id = id;
        this._actuations = actuations ?? [];
    }

    public get id(): string {
        return this._id
    }

    public get actuations(): IActuation[] {
        return this._actuations;
    }

    public getStore(): Store {
        const store = new Store();
        store.addQuad(namedNode(this.id), RDF.terms.type, SOSA.terms.Actuator);

        for (const actuation of this.actuations) {
            store.addQuad(namedNode(this.id), SOSA.terms.madeObservation, SOSA.terms.Actuator); // Note: should I add this?
            store.addQuads(actuation.getStore().getQuads(null, null, null, null));
        }
        return store
    }
}
