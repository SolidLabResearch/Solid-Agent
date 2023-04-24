import {readText} from "koreografeye";
import * as path from 'path';


export class DemoSyncAgent {
    //TODO: make -> OpenHAB agent not needed here

    private rules = [
        readText(path.join(__dirname,'./rules/experimentalRule.n3'))!,

    ]
}
