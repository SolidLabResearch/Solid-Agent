interface Event {
    /**
     * The identifier of the application. 
     * This correponds to the identifier in the configuration of the application.
     */
    app: string,
    /**
     * The identifier of the source (within the app profile).
     * Can be the Solid Pod itself or a third party application.
     */
    source: string,
    /**
     * The current state of the application.
     */
    state: string,
    /**
     * The format of the state.
     * e.g. JSON, turtle, ...
     */
    format: string,
    /**
     * The timestamp that the event came into the Solid Agent.
     */
    timestamp: Date
}

const configuration = {
    applicationIdentifier: "philips",
    sources: [
        { 
            "type": "SolidSource",
            "id": "http://localhost:3000/philips/"  
        },
        {   
            "type": "HueBridgeAPI",
            "id": "https://developers.meethue.com/{username}/"  
        }
    ]
}

// Should I work with queues? https://dev.to/glebirovich/typescript-data-structures-stack-and-queue-hld#queue


class Receiver {
    // Responsability is to handle incoming messages from a third party or the Solid server.
    // This can either be push/pull based or even hybrid

    // When the state of the application is retrieved (source doesn't matter), an event is pushed to the designated queue.
}

const mapperQueue = [];

class Mapper {
    // Maps incoming events from third parties which are not in any RDF format to RDF using RML rules defined in the configuration.

    // pushes everything to the next queue, but now the state is in RDF (more specifically Quads?)
}


const processorQueue = [];

class Processor {
    // Decides which actors must be updated.
    // This way all the actors involved in the app are now synchronized with the newest change.

    // Responsability: Picking the transmitters to send an update for the state.

    // In the future, extra triggers can be executed here -> i.e. sent a notification to my phone, close lights at 8pm, ...

    // A cache here may help to filter out duplicate events + help calculating wich parties must be updated (if it comes from a given source, than that source does not have to be updated)
}

const inverseMapperQueue = [];

class InverseMapper {
    // Maps incoming events with as target third parties its state to the format that the third party understands.
    // Events not to third parties, are passed to the transmission queue.
}

const transmissionQueue = [];

class Transmitter {
    // Update
}