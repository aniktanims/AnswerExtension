// This script runs in the background

// Check if chrome is defined, if not, we are likely in a testing environment
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log("Google AI Text Analyzer extension installed")

    // Pre-save the API key
    chrome.storage.sync.set({
      gemini_api_key: "AIzaSyBXSl3egXRahZUnE4sJiJuOzFcWG2tZUFU",
    })
  })

  // Create context menu item
  chrome.contextMenus.create({
    id: "analyzeText",
    title: "Analyze with Google AI",
    contexts: ["selection"],
  })

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "analyzeText" && info.selectionText) {
      // Open the popup
      chrome.action.openPopup()
    }
  })
} else {
  console.log("Running outside of Chrome extension environment.")
}
