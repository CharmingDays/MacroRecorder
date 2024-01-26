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


async function tagContentCopy(event:HTMLEmbedElement) {

}



document.addEventListener('keydown',tagContentCopy)


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


async function checkLoadedState(mainStorage,hostname:string,uri:string) {
    const postLoads = mainStorage[hostname][uri];
    if (postLoads) {
        return true
    }
    return false
}


const asyncLoadState = async (mainStorage,hostname,uri) =>{
    return await checkLoadedState(mainStorage,hostname,uri)
}


storage.get(storageName).then((value) => {
    // preload the recorded macros for the current page
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {  
        const currentURI = tabs[0].url;
        const hostname = new URL(currentURI).hostname;
        const webPageURI: any | boolean = value[hostname] ? value[hostname] : false;
        const loadState = asyncLoadState(value,hostname, currentURI)
        if (!loadState) return // page already preloaded 
        if (webPageURI) {
            const steps:[string] | boolean = webPageURI[currentURI] ? value[currentURI] : false;
            if (typeof steps === "object") {
                clickSelectorPaths(steps);
            }
        }

    });
});


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