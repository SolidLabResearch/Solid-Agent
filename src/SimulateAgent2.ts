import { v4 as uuidv4 } from 'uuid';

class State {
    private _value: string
    private _history: History;
    private _openHAB: OpenHAB;

    constructor() {
        this._value = "nothing"
        this._history = new History(this)
        this._openHAB = new OpenHAB(this._history, this)
    }

    public get value(): string {
        return this._value
    }

    public set value(v: string) {
        console.log(`${new Date().toISOString()} [${this.constructor.name}]: set new value: ${v}`);
        
        this._value = v;

        // should be a call to an agent! TODO:
        if (this.value !== this._history.latest){
            this._history.append(this.value);
            this._openHAB.value = this.value;
        } else {
            console.log(`${new Date().toISOString()} [${this.constructor.name}]: state same as latest history value: ${v}`);
        }
    }

    
    public get history() : History {
        return this._history
    }

    
    public get openHAB() : OpenHAB {
        return this._openHAB
    }
    
    
}

class History {
    private _history: string[]
    private state: State

    constructor(state: State) {
        this.state = state
        this._history = [state.value]
    }

    public append(value: string) {
        console.log(`${new Date().toISOString()} [${this.constructor.name}]: new actuation added to history ${value}`);

        this._history.push(value);

        // should be a call to an agent! TODO:
        this.state.value = value

    }

    public get latest(): string {
        return this._history[this._history.length - 1]
    }

    
    public get history() : string[] {
        return this._history
    }
    
}

class OpenHAB {
    private _value: string;
    private history: History;
    private state: State
    constructor(history: History, state: State) {
        this.history = history
        this._value = history.latest
        this.state = state
    }

    public set value(v: string) {
        this._value = v
        console.log(`${new Date().toISOString()} [${this.constructor.name}]: openHAB situation ${v}`);

        // should be a call to an agent! TODO:
        this.history.append(v)
        // Agent both acts on state and history -> does nothing
        // this.state.value = v
    }

    
    public get value() : string {
        return this._value
    }
    
}

// turning light on with state (push based)
function expirement1() {
    const state = new State()
    const history = state.history
    const openHAB = state.openHAB
    
    state.value = "on"
    
    console.log("results");
    
    console.log(`state: ${state.value}`);
    console.log(`history: [${history.history}]`);
    console.log(`openHAB: ${openHAB.value}`);
}

// turning light on with through openHAB (push based)
function expirement2() {
    const state = new State()
    const history = state.history
    const openHAB = state.openHAB
    
    openHAB.value = "on"
    
    console.log("results");
    
    console.log(`state: ${state.value}`);
    console.log(`history: [${history.history}]`);
    console.log(`openHAB: ${openHAB.value}`);
}
// turning light on by adding something manually to history (push based) 
function expirement3() {
    const state = new State()
    const history = state.history
    const openHAB = state.openHAB
    
    history.append("on")
    
    console.log("results");
    
    console.log(`state: ${state.value}`);
    console.log(`history: [${history.history}]`);
    console.log(`openHAB: ${openHAB.value}`);
}

expirement1()
// Result: everything ok, system stops and everything fine
expirement2()
// Result: everything ok, system stops and everything fine
expirement3()
// Result: light does not turn on