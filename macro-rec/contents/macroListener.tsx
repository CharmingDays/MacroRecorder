import { Storage } from "@plasmohq/storage";
import {v4 as uuidv4} from "uuid";


const storage = new Storage();
const storageName = "MacroRecorderKey"
const tempStorageName = "TempMacroRecorderKey"

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

}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action.toLowerCase() === "record macro") {
        document.addEventListener("click", stepRecorder);
    }
    else if (message.action.toLowerCase() === "stop") {
        document.removeEventListener("click", stepRecorder);
    }
});