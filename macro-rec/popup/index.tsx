import { Storage } from "@plasmohq/storage";


const storage = new Storage();
const storageName = "MacroRecorderKey"

async function displayMacros() {
    /**
     * Displays the recorded macros in a dropdown list.
     * Retrieves the current macros from storage and populates the dropdown list with the macro names.
     * If there are no macros recorded, an empty object is stored in the storage.
     * 
     * @returns {Promise<void>} A promise that resolves once the macros are displayed.
     */
    const currentMacros = await storage.get(storageName);
    const container = document.getElementById("recorded-macros") as HTMLFormElement;
    if (currentMacros === "" || currentMacros === "") {
        await storage.set(storageName, {});
    }
    else {
        for (const macroName in Object.keys(currentMacros)) {
            const option = document.createElement("option");
            option.innerHTML = macroName;
            option.value = macroName;
            container.appendChild(option);
        }
    }
}



document.addEventListener("DOMContentLoaded", async () => {
    displayMacros();
    document.getElementById("macroRecorder").addEventListener("click", (event) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const button = event.target as HTMLButtonElement;
            chrome.tabs.sendMessage(tabs[0].id, { message: button.id }, (response) => {
                button.innerHTML = response.nextState;
            });
        });
    });
});