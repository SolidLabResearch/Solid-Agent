import {N3Support} from "@treecg/ldes-snapshot";
import {IActuator} from "./Actuator";

export interface IPlatform extends N3Support {
    id: string
    hosts: IActuator[]
}
