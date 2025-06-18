// Listen for messages from the popup
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSelectedText") {
      const selectedText = window.getSelection().toString()
      sendResponse({ selectedText })
    }
    return true
  })
}
