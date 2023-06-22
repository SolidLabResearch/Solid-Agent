import {App, AppRunner} from "@solid/community-server";
import Path from "path";


/**
 * Instantiate a solid server app in silent mode at `http://localhost:${port}/`.
 * Memory backend with registration.
 *
 * @param {number} port
 * @returns
 */
export async function instantiateCSS(port: number): Promise<App> {
    const baseUrl = `http://localhost:${port}/`
    const app = await new AppRunner().create(
        {
            mainModulePath: `${__dirname}/`,
            logLevel: 'error',
            typeChecking: false,
        },
        Path.join(__dirname, 'memory.json'),
        {
            'urn:solid-server:default:variable:loggingLevel': 'error',
            'urn:solid-server:default:variable:port': port,
            'urn:solid-server:default:variable:baseUrl': baseUrl,
        }
    );

    return app
}

export async function createAccount(baseUrl:string,account: {email:string, password:string, podName:string}): Promise<void> {
    const registrationBody = {
        confirmPassword: account.password,
        createPod: "on",
        createWebId: "on",
        email: account.email,
        password: account.password,
        podName: account.podName,
        register: "on",
        registration: "on",
        webId: "",
    }

    const response = await fetch(baseUrl + "setup", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'content-type': 'application/json'
        },
        body: JSON.stringify(registrationBody)
    })
}
