import { Store } from 'n3';

/**
 * Calculates the state of the lights based of a SOSA/SSN graph.
 * 
 * @param store - store containing the complete SOSA/SSN graph.
 */
function calculatePhilipsHueState(store: Store): Store {
    // parse whole platform

    // from the actuator(s), filter all actuations on featureOfInterest

    return new Store()
}

interface PhilipsHueActuation {

}

interface Platform {
    hosts: Actuator[]
}

interface Actuator {
    madeActuation: Actuation
}

interface Actuation {
    actsOnProperty: ActuableProperty
    hasFeatureOfInterest: FeatureOfInterest
    hasResult: Result
    resultTime: Date
}

interface ActuableProperty {
    
}

interface FeatureOfInterest {

}

interface Result {

}