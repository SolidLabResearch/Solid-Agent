import {createUriAndTermNamespace} from "@solid/community-server"

export const AS = createUriAndTermNamespace('https://www.w3.org/ns/activitystreams#',
    'Announce',
    'actor',
    'target',
    'object',
    'to'
)
export const SOSA = createUriAndTermNamespace('http://www.w3.org/ns/sosa/',
    'Platform',
    'Actuator',
    'FeatureOfInterest',
    'ActuatableProperty',
    'Actuation',
    'Result',
    'isHostedBy',
    'madeByActuator',
    'madeObservation',
    'hasFeatureOfInterest',
    'actsOnProperty',
    'resultTime',
    'hasResult'
)

export const SAREF = createUriAndTermNamespace('https://saref.etsi.org/core/',
    'hasState',
    'OnState',
    'OffState'
)

export const DBR = createUriAndTermNamespace('http://dbpedia.org/resource/',
    'Hue',
    'Brightness',
    'Colorfulness'
)
