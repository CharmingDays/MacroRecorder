import type { PlasmoCSConfig } from "plasmo";
import { Storage } from "@plasmohq/storage";
import {v4 as uuidv4} from "uuid";


const storage = new Storage();
const storageName = "MacroRecorderKey"
const tempStorageName = "TempMacroRecorderKey"



export const config:PlasmoCSConfig = {
    matches: ["<all_urls>"]
}


function createSelectorPath(elementId: string): string {
    const element = document.getElementById(elementId);
    if (!element) {
        return "";
    }

    const path = [];
    let currentElement = element;

    while (currentElement) {
        let selector = currentElement.tagName.toLowerCase();
        if (currentElement.id) {
            selector += `#${currentElement.id}`;
            path.unshift(selector);
            break;
        } else {
            let index = 1;
            let sibling = currentElement.previousElementSibling;

            while (sibling) {
                if (sibling.tagName.toLowerCase() === selector) {
                    index++;
                }
                sibling = sibling.previousElementSibling;
            }

            if (index > 1) {
                selector += `:nth-child(${index})`;
            }

            path.unshift(selector);
            currentElement = currentElement.parentElement;
        }
    }

    return path.join(" > ");
}


async function stepRecorder(event) {
    const htmlTag = event.target as HTMLElement;
    const newId = uuidv4();
    htmlTag.id = newId;
    const selectorPath:string = createSelectorPath(newId);
    if (selectorPath === "") {
        // not an element or no selector path found
        return;
    }
    const tempContainer:any = await storage.get(tempStorageName);
    if (tempContainer === undefined || tempContainer.toLowerCase() === "") {
        await storage.set(tempStorageName, [selectorPath]);
    }
    else {
        tempContainer.push(selectorPath);
        await storage.set(tempStorageName, tempContainer);
    }
}

async function finalizeRecordings() {
    const recordedSteps = await storage.get(tempStorageName);
    const currentMacros =await storage.get(storageName);
    if (recordedSteps === "" || recordedSteps === undefined) {
        return;
    
    }

}



function clickSelectorPaths(selectorPaths:[string]) {
    /*
    * Clicks all the elements in the selectorPaths array
    */
    for (const selector of selectorPaths) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
            element.click();
        }
    }
}


const preloadWebpage = async () => {
    /*
    * Preload the webpage with the recorded steps
    preloaded steps container example:
    {
        "preloads": {
            "google.com": {
                "uri": [selectorPath1, selectorPath2, ...]
            }
    }
    */
    const mainStorage =  await storage.get(storageName);
    if (mainStorage.hasOwnProperty("preloads")) {
        const preloads  = mainStorage['preloads'];
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentURI = tabs[0].url;
            const domainName = new URL(currentURI).hostname;
            if (preloads.hasOwnProperty(domainName)) {
                const domainSteps = preloads[domainName];
                if (domainSteps.hasOwnProperty(currentURI)) {
                    clickSelectorPaths(domainSteps[currentURI])
                }
            }
        });
    }
}



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const ButtonStates = {'Record Macro': 'Stop', 'Stop': 'Record Macro'}
    if (message.action.toLowerCase() === "record macro") {
        document.addEventListener("click", stepRecorder);
    }
    else if (message.action.toLowerCase() === "stop") {
        document.removeEventListener("click", stepRecorder);
        finalizeRecordings();
    }
    sendResponse({nextState: ButtonStates[message.action]});
});