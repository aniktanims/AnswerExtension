// Debug helper function
function debugLog(message) {
  console.log(`[Bengali AI Assistant] ${message}`)
}

// Detect questions on the page
function detectQuestions(selector = ".text-xl") {
  debugLog(`Detecting questions with selector: ${selector}`)
  const questions = []

  try {
    // Find all elements with the specified selector
    const elements = document.querySelectorAll(selector)
    debugLog(`Found ${elements.length} elements with selector: ${selector}`)

    // Extract text from each element
    elements.forEach((element) => {
      const text = element.textContent.trim()
      if (text && !questions.includes(text)) {
        questions.push(text)
        debugLog(`Added question: ${text.substring(0, 30)}...`)
      }
    })

    return questions
  } catch (error) {
    debugLog(`Error detecting questions: ${error.message}`)
    return []
  }
}

// Find a suitable container to display answers
function findAnswerContainer() {
  debugLog("Finding suitable container for answers")

  try {
    // Try to find a good container near the questions
    const questionElements = document.querySelectorAll(".text-xl")

    if (questionElements.length > 0) {
      // Try to find a parent container
      let container = questionElements[0].closest("div[class*='container'], main, article, section")

      // If no suitable container found, use the parent of the last question
      if (!container) {
        const lastQuestion = questionElements[questionElements.length - 1]
        container = lastQuestion.parentElement

        // Go up one more level if the direct parent seems too narrow
        if (container && container.clientWidth < 500) {
          container = container.parentElement
        }
      }

      if (container) {
        debugLog(`Found container: ${container.tagName} with classes: ${container.className}`)
        return container
      }
    }

    // Fallback to main content areas
    const mainContent =
      document.querySelector("main") ||
      document.querySelector("article") ||
      document.querySelector(".content") ||
      document.querySelector("#content")

    if (mainContent) {
      debugLog(`Using main content container: ${mainContent.tagName}`)
      return mainContent
    }

    // Last resort: body
    debugLog("No suitable container found, using document.body")
    return document.body
  } catch (error) {
    debugLog(`Error finding answer container: ${error.message}`)
    return document.body
  }
}

// Replace the displayAnswers function with this improved version that creates a floating window
function displayAnswers(questions, answers) {
  debugLog(`Displaying ${answers.length} answers in floating window`)

  try {
    // Create a floating container for the answers
    const floatingContainer = document.createElement("div")
    floatingContainer.className = "ai-answer-container"
    floatingContainer.style.position = "fixed"
    floatingContainer.style.bottom = "20px"
    floatingContainer.style.right = "20px"
    floatingContainer.style.width = "400px"
    floatingContainer.style.maxHeight = "80vh"
    floatingContainer.style.overflowY = "auto"
    floatingContainer.style.backgroundColor = "rgba(255, 255, 255, 0.95)"
    floatingContainer.style.borderRadius = "8px"
    floatingContainer.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"
    floatingContainer.style.padding = "16px"
    floatingContainer.style.zIndex = "10000"
    floatingContainer.style.border = "1px solid #e0e0e0"
    floatingContainer.style.backdropFilter = "blur(5px)"
    floatingContainer.style.transition = "opacity 0.3s ease"

    // Create header
    const header = document.createElement("div")
    header.className = "ai-answer-header"
    header.style.display = "flex"
    header.style.justifyContent = "space-between"
    header.style.alignItems = "center"
    header.style.marginBottom = "12px"
    header.style.borderBottom = "1px solid #e0e0e0"
    header.style.paddingBottom = "8px"
    header.style.cursor = "move" // Indicate it's draggable

    const title = document.createElement("h3")
    title.className = "ai-answer-title"
    title.textContent = "উত্তর দেখুন- MTA"
    title.style.margin = "0"
    title.style.fontSize = "16px"
    title.style.color = "#e86c1a"

    const buttonsContainer = document.createElement("div")
    buttonsContainer.style.display = "flex"
    buttonsContainer.style.gap = "8px"

    // Add minimize button
    const minimizeButton = document.createElement("button")
    minimizeButton.textContent = "Hide"
    minimizeButton.style.background = "none"
    minimizeButton.style.border = "none"
    minimizeButton.style.fontSize = "16px"
    minimizeButton.style.cursor = "pointer"
    minimizeButton.style.color = "#666"
    minimizeButton.style.width = "24px"
    minimizeButton.style.height = "24px"
    minimizeButton.style.display = "flex"
    minimizeButton.style.alignItems = "center"
    minimizeButton.style.justifyContent = "center"
    minimizeButton.title = "Minimize"

    let isMinimized = false
    const contentContainer = document.createElement("div")

    minimizeButton.onclick = () => {
      isMinimized = !isMinimized
      if (isMinimized) {
        contentContainer.style.display = "none"
        minimizeButton.textContent = "+"
        minimizeButton.title = "Expand"
        floatingContainer.style.height = "auto"
      } else {
        contentContainer.style.display = "block"
        minimizeButton.textContent = "Hide"
        minimizeButton.title = "Minimize"
      }
    }

    // Add close button
    const closeButton = document.createElement("button")
    closeButton.textContent = "×"
    closeButton.style.background = "none"
    closeButton.style.border = "none"
    closeButton.style.fontSize = "20px"
    closeButton.style.cursor = "pointer"
    closeButton.style.color = "red"
    closeButton.style.width = "24px"
    closeButton.style.height = "24px"
    closeButton.style.display = "flex"
    closeButton.style.alignItems = "center"
    closeButton.style.justifyContent = "center"
    closeButton.title = "Close"

    closeButton.onclick = () => {
      document.body.removeChild(floatingContainer)
    }

    buttonsContainer.appendChild(minimizeButton)
    buttonsContainer.appendChild(closeButton)
    header.appendChild(title)
    header.appendChild(buttonsContainer)
    floatingContainer.appendChild(header)

    // Create content container
    contentContainer.style.overflowY = "auto"
    contentContainer.style.maxHeight = "calc(80vh - 60px)"

    // Add each question and answer
    for (let i = 0; i < questions.length; i++) {
      const qaDiv = document.createElement("div")
      qaDiv.className = "ai-qa-pair"
      qaDiv.style.marginBottom = "16px"
      qaDiv.style.padding = "12px"
      qaDiv.style.backgroundColor = "white"
      qaDiv.style.borderRadius = "6px"
      qaDiv.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)"

      const questionDiv = document.createElement("div")
      questionDiv.className = "ai-question"
      questionDiv.textContent = questions[i]
      questionDiv.style.fontWeight = "bold"
      questionDiv.style.marginBottom = "8px"
      questionDiv.style.color = "#333"
      questionDiv.style.fontSize = "14px"

      const answerDiv = document.createElement("div")
      answerDiv.className = "ai-answer"
      answerDiv.textContent = answers[i]
      answerDiv.style.color = "#444"
      answerDiv.style.lineHeight = "1.5"
      answerDiv.style.whiteSpace = "pre-wrap"
      answerDiv.style.fontSize = "14px"

      qaDiv.appendChild(questionDiv)
      qaDiv.appendChild(answerDiv)
      contentContainer.appendChild(qaDiv)
    }

    floatingContainer.appendChild(contentContainer)

    // Remove any existing answer container
    const existingContainer = document.querySelector(".ai-answer-container")
    if (existingContainer) {
      document.body.removeChild(existingContainer)
    }

    // Add the container to the page
    document.body.appendChild(floatingContainer)

    // Make it draggable
    makeDraggable(floatingContainer, header)

    // Add opacity hover effect
    floatingContainer.style.opacity = "0.9"
    floatingContainer.addEventListener("mouseenter", () => {
      floatingContainer.style.opacity = "1"
    })
    floatingContainer.addEventListener("mouseleave", () => {
      floatingContainer.style.opacity = "0.9"
    })

    debugLog("Floating answers displayed successfully")
    return true
  } catch (error) {
    debugLog(`Error displaying floating answers: ${error.message}`)
    return false
  }
}

// Update the displaySingleAnswer function to use the new floating window approach
function displaySingleAnswer(question, answer) {
  return displayAnswers([question], [answer])
}

// Helper function to find the target div
function findTargetDiv(targetDivClass) {
  try {
    const targetDiv = document.querySelector(targetDivClass)
    if (!targetDiv) {
      console.warn(`Target div with class "${targetDivClass}" not found.`)
      return null
    }
    return targetDiv
  } catch (error) {
    console.error(`Error finding target div: ${error.message}`)
    return null
  }
}

// Improve the makeDraggable function to be smoother
function makeDraggable(element, handle) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0

  handle.style.cursor = "move"
  handle.onmousedown = dragMouseDown

  function dragMouseDown(e) {
    e = e || window.event
    e.preventDefault()
    // Get the mouse cursor position at startup
    pos3 = e.clientX
    pos4 = e.clientY
    document.onmouseup = closeDragElement
    // Call a function whenever the cursor moves
    document.onmousemove = elementDrag

    // Add a dragging class for visual feedback
    element.classList.add("ai-dragging")
  }

  function elementDrag(e) {
    e = e || window.event
    e.preventDefault()
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY

    // Set the element's new position
    const newTop = element.offsetTop - pos2
    const newLeft = element.offsetLeft - pos1

    // Keep the element within the viewport
    const maxTop = window.innerHeight - 50
    const maxLeft = window.innerWidth - 50

    element.style.top = Math.min(Math.max(newTop, 0), maxTop) + "px"
    element.style.left = Math.min(Math.max(newLeft, 0), maxLeft) + "px"

    // Ensure it stays fixed position
    element.style.bottom = "auto"
    element.style.right = "auto"
  }

  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null
    document.onmousemove = null

    // Remove the dragging class
    element.classList.remove("ai-dragging")
  }
}

// Remove the displayAnswerInDiv and displayFloatingAnswer functions since we're now using a single approach
// The displayAnswer function should now just call displayAnswers
function displayAnswer(input, answer) {
  debugLog(`Display answer called for input: ${input.substring(0, 30)}...`)
  return displayAnswers([input], [answer])
}

// Main function to display answer (either in target div or floating)
// function displayAnswer(input, answer, targetDivClass) {
//   debugLog(`Display answer called. Target div class: ${targetDivClass}`)

//   // If a target div is specified, try to display there first
//   if (targetDivClass) {
//     const success = displayAnswerInDiv(input, answer, targetDivClass)
//     if (success) {
//       return true
//     }
//     // If failed to display in target div, fall back to floating display
//     debugLog("Failed to display in target div, falling back to floating display")
//   }

//   // Display as floating box if no target div or if target div display failed
//   return displayFloatingAnswer(input, answer)
// }

// Auto-detect questions when the page loads
function autoDetectQuestions() {
  debugLog("Auto-detecting questions")

  // Get settings from storage
  if (typeof chrome !== "undefined" && typeof chrome.storage !== "undefined") {
    chrome.storage.sync.get(["autoDetect", "questionSelector"], (settings) => {
      if (settings.autoDetect) {
        const selector = settings.questionSelector || ".text-xl"
        const questions = detectQuestions(selector)

        if (questions.length > 0) {
          debugLog(`Auto-detected ${questions.length} questions`)

          // Send questions to popup if it's open
          try {
            chrome.runtime.sendMessage({
              action: "questionsDetected",
              questions: questions,
            })
          } catch (e) {
            console.log(e)
          }
        }
      }
    })
  }
}

// Listen for messages from popup
if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined") {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debugLog(`Received message: ${request.action}`)

    if (request.action === "detectQuestions") {
      const questions = detectQuestions(request.selector)
      debugLog(`Detected ${questions.length} questions`)
      sendResponse({ success: true, questions: questions })
    } else if (request.action === "displayAnswers") {
      debugLog(`Displaying ${request.questions.length} answers`)
      const success = displayAnswers(request.questions, request.answers)
      sendResponse({ success: success })
    } else if (request.action === "displaySingleAnswer") {
      debugLog(`Displaying single answer for: ${request.question.substring(0, 30)}...`)
      const success = displaySingleAnswer(request.question, request.answer)
      sendResponse({ success: success })
    } else if (request.action === "clearAnswers") {
      debugLog("Clearing answers")
      const container = document.querySelector(".ai-answer-container")
      if (container) {
        container.parentNode.removeChild(container)
      }
      sendResponse({ success: true })
    }

    return true // Required for async sendResponse
  })
}

// Run when the page loads
window.addEventListener("load", () => {
  debugLog("Page loaded")

  // Wait a bit for the page to fully render
  setTimeout(() => {
    autoDetectQuestions()
  }, 1000)
})

// Run when extension is first injected
autoDetectQuestions()

debugLog("Content script loaded successfully")
