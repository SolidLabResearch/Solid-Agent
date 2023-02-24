import {RDF} from "@solid/community-server"
import {dateToLiteral, N3Support} from "@treecg/ldes-snapshot"
import {DataFactory, Store} from "n3"
import {SOSA} from "../Vocabulary"
import {IActuatableProperty} from "./ActuatableProperty"
import {IFeatureOfInterest} from "./FeatureOfInterest"
import {IResult} from "./Result"

const namedNode = DataFactory.namedNode

export interface IActuation extends N3Support {
    id: string
    actuator: string
    actuatableProperty: IActuatableProperty
    featureOfInterest: IFeatureOfInterest
    result: IResult
    resultTime: Date
}

export class Actuation implements IActuation {
    private _id: string;
    private _actuator: string
    private _actsOnProperty: IActuatableProperty
    private _hasFeatureOfInterest: IFeatureOfInterest
    private _hasResult: IResult
    private _resultTime: Date


    constructor(id: string, actuator: string, actsOnProperty: IActuatableProperty, hasFeatureOfInterest: IFeatureOfInterest, hasResult: IResult, resultTime: Date) {
        this._id = id;
        this._actuator = actuator;
        this._actsOnProperty = actsOnProperty;
        this._hasFeatureOfInterest = hasFeatureOfInterest;
        this._hasResult = hasResult;
        this._resultTime = resultTime;
    }

    public get id(): string {
        return this._id
    }


    public get actuator(): string {
        return this._actuator
    }


    public get actuatableProperty(): IActuatableProperty {
        return this._actsOnProperty;
    }


    public get featureOfInterest(): IFeatureOfInterest {
        return this._hasFeatureOfInterest;
    }

    public get result(): IResult {
        return this._hasResult;
    }

    public get resultTime(): Date {
        return this._resultTime;
    }



    public getStore(): Store {
        const store = new Store();
        store.addQuad(namedNode(this.id), RDF.terms.type, SOSA.terms.Actuation);
        store.addQuad(namedNode(this.id), SOSA.terms.madeByActuator, namedNode(this.actuator));
        store.addQuad(namedNode(this.id), SOSA.terms.resultTime, dateToLiteral(this.resultTime));
        store.addQuads(this.actuatableProperty.getStore().getQuads(null, null, null, null));
        store.addQuads(this.result.getStore().getQuads(null, null, null, null));
        store.addQuads(this.featureOfInterest.getStore().getQuads(null, null, null, null));

        return store
    }
}
