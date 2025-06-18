document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const autoTab = document.getElementById("auto-tab")
  const manualTab = document.getElementById("manual-tab")
  const autoPanel = document.getElementById("auto-panel")
  const manualPanel = document.getElementById("manual-panel")
  const statusDiv = document.getElementById("status")
  const questionsContainer = document.getElementById("questions-container")
  const questionList = document.getElementById("question-list")
  const answerContainer = document.getElementById("answer-container")
  const answerContent = document.getElementById("answer-content")
  const scanBtn = document.getElementById("scan-btn")
  const generateAllBtn = document.getElementById("generate-all-btn")
  const displayAllBtn = document.getElementById("display-all-btn")
  const manualInput = document.getElementById("manual-input")
  const manualGenerateBtn = document.getElementById("manual-generate-btn")
  const manualDisplayBtn = document.getElementById("manual-display-btn")
  const copyAnswerBtn = document.getElementById("copy-answer-btn")
  const settingsToggleBtn = document.getElementById("settings-toggle-btn")
  const settingsPanel = document.getElementById("settings-panel")
  const apiKeyInput = document.getElementById("api-key")
  const modelSelect = document.getElementById("model-select")
  const questionSelectorInput = document.getElementById("question-selector")
  const autoDetectCheckbox = document.getElementById("auto-detect")
  const respondBengaliCheckbox = document.getElementById("respond-bengali")
  const showNotificationsCheckbox = document.getElementById("show-notifications")
  const saveSettingsBtn = document.getElementById("save-settings")
  const resetStatsBtn = document.getElementById("reset-stats")
  const debugInfo = document.getElementById("debug-info")
  
  // Notification elements
  const notificationArea = document.getElementById("notification-area")
  const notificationContent = document.getElementById("notification-content")
  const notificationText = document.getElementById("notification-text")
  const notificationClose = document.getElementById("notification-close")
  
  // Usage stats elements
  const todayCountElement = document.getElementById("today-count")
  const totalTimeElement = document.getElementById("total-time")

  // State variables
  let detectedQuestions = []
  let currentAnswers = []
  let selectedQuestionIndex = -1
  let currentManualQuestion = ""
  let currentManualAnswer = ""
  let sessionStartTime = Date.now()

  // Debug helper function
  function log(message) {
    console.log(`[Bengali AI Assistant] ${message}`)
    if (debugInfo) {
      const timestamp = new Date().toLocaleTimeString()
      debugInfo.innerHTML += `<div>[${timestamp}] ${message}</div>`
      debugInfo.scrollTop = debugInfo.scrollHeight
    }
  }

  // Notification functions
  function showNotification(message, type = 'success', duration = 5000) {
    chrome.storage.sync.get(['showNotifications'], (settings) => {
      if (settings.showNotifications === false) return
      
      notificationText.textContent = message
      notificationContent.className = `notification-content ${type}`
      notificationArea.classList.remove('hidden')
      
      log(`Notification: ${message} (${type})`)
      
      // Auto-hide after duration
      setTimeout(() => {
        hideNotification()
      }, duration)
    })
  }

  function hideNotification() {
    notificationArea.classList.add('hidden')
  }

  // Usage tracking functions
  function updateUsageStats() {
    const today = new Date().toDateString()
    
    chrome.storage.local.get(['usageStats'], (result) => {
      const stats = result.usageStats || {}
      const todayStats = stats[today] || { questionsAnswered: 0, timeSpent: 0 }
      
      // Update display
      todayCountElement.textContent = todayStats.questionsAnswered
      
      // Calculate total time (session time + stored time)
      const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000 / 60) // minutes
      const totalTime = todayStats.timeSpent + sessionTime
      
      if (totalTime < 60) {
        totalTimeElement.textContent = `${totalTime}m`
      } else {
        const hours = Math.floor(totalTime / 60)
        const minutes = totalTime % 60
        totalTimeElement.textContent = `${hours}h ${minutes}m`
      }
    })
  }

  function incrementQuestionCount() {
    const today = new Date().toDateString()
    
    chrome.storage.local.get(['usageStats'], (result) => {
      const stats = result.usageStats || {}
      const todayStats = stats[today] || { questionsAnswered: 0, timeSpent: 0 }
      
      todayStats.questionsAnswered += 1
      stats[today] = todayStats
      
      chrome.storage.local.set({ usageStats: stats }, () => {
        updateUsageStats()
        
        // Add animation to the count
        todayCountElement.classList.add('updated')
        setTimeout(() => {
          todayCountElement.classList.remove('updated')
        }, 500)
        
        log(`Question count incremented to ${todayStats.questionsAnswered}`)
      })
    })
  }

  function saveSessionTime() {
    const today = new Date().toDateString()
    const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000 / 60) // minutes
    
    chrome.storage.local.get(['usageStats'], (result) => {
      const stats = result.usageStats || {}
      const todayStats = stats[today] || { questionsAnswered: 0, timeSpent: 0 }
      
      todayStats.timeSpent += sessionTime
      stats[today] = todayStats
      
      chrome.storage.local.set({ usageStats: stats })
      sessionStartTime = Date.now() // Reset session timer
    })
  }

  function resetStats() {
    if (confirm('Are you sure you want to reset all usage statistics?')) {
      chrome.storage.local.remove(['usageStats'], () => {
        updateUsageStats()
        showNotification('Usage statistics have been reset', 'info')
        log('Usage statistics reset')
      })
    }
  }

  // Tab switching
  autoTab.addEventListener("click", () => {
    log("Switching to Auto tab")
    autoTab.classList.add("active")
    manualTab.classList.remove("active")
    autoPanel.classList.remove("hidden")
    manualPanel.classList.add("hidden")
  })

  manualTab.addEventListener("click", () => {
    log("Switching to Manual tab")
    manualTab.classList.add("active")
    autoTab.classList.remove("active")
    manualPanel.classList.remove("hidden")
    autoPanel.classList.add("hidden")

    // Clear any previous answers when switching to manual mode
    answerContainer.classList.add("hidden")
  })

  // Settings toggle
  settingsToggleBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("hidden")
    settingsToggleBtn.textContent = settingsPanel.classList.contains("hidden") ? "Settings" : "Hide Settings"
  })

  // Notification close
  notificationClose.addEventListener("click", hideNotification)

  // Reset stats button
  resetStatsBtn.addEventListener("click", resetStats)

  // Load settings
  function loadSettings() {
    log("Loading settings")
    chrome.storage.sync.get(["apiKey", "model", "questionSelector", "autoDetect", "respondBengali", "showNotifications"], (settings) => {
      if (settings.apiKey) apiKeyInput.value = settings.apiKey
      if (settings.model) modelSelect.value = settings.model
      if (settings.questionSelector) questionSelectorInput.value = settings.questionSelector
      if (settings.autoDetect !== undefined) autoDetectCheckbox.checked = settings.autoDetect
      if (settings.respondBengali !== undefined) respondBengaliCheckbox.checked = settings.respondBengali
      if (settings.showNotifications !== undefined) showNotificationsCheckbox.checked = settings.showNotifications

      log("Settings loaded successfully")
    })
  }

  // Save settings
  saveSettingsBtn.addEventListener("click", () => {
    const settings = {
      apiKey: apiKeyInput.value,
      model: modelSelect.value,
      questionSelector: questionSelectorInput.value,
      autoDetect: autoDetectCheckbox.checked,
      respondBengali: respondBengaliCheckbox.checked,
      showNotifications: showNotificationsCheckbox.checked,
    }

    log("Saving settings: " + JSON.stringify(settings))
    chrome.storage.sync.set(settings, () => {
      log("Settings saved successfully")
      showNotification("Settings saved successfully!", "success")
      settingsPanel.classList.add("hidden")
      settingsToggleBtn.textContent = "Settings"
    })
  })

  // Get current settings
  function getSettings() {
    return {
      apiKey: apiKeyInput.value,
      model: modelSelect.value,
      respondBengali: respondBengaliCheckbox.checked,
    }
  }

  // Scan page for questions
  function scanPage() {
    statusDiv.textContent = "Scanning page for questions..."
    log("Scanning page for questions")

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        const errorMsg = "Error: Cannot access the current tab"
        statusDiv.textContent = errorMsg
        log(errorMsg)
        showNotification(errorMsg, "error")
        return
      }

      const selector = questionSelectorInput.value || ".text-xl"
      log(`Using selector: ${selector}`)

      chrome.tabs.sendMessage(tabs[0].id, { action: "detectQuestions", selector: selector }, (response) => {
        if (chrome.runtime.lastError) {
          const errorMsg = `Error: ${chrome.runtime.lastError.message}`
          statusDiv.textContent = errorMsg
          log(errorMsg)
          showNotification(errorMsg, "error")
          return
        }

        if (!response || !response.success) {
          const errorMsg = "Error detecting questions"
          statusDiv.textContent = errorMsg
          log(errorMsg)
          showNotification(errorMsg, "error")
          return
        }

        detectedQuestions = response.questions
        log(`${detectedQuestions.length} প্রশ্ন পাওয়া গেছে`)

        if (detectedQuestions.length === 0) {
          statusDiv.textContent = "কোন প্রশ্ন পাওয়া যায়নি"
          questionsContainer.classList.add("hidden")
          showNotification("No questions found on this page", "warning")
          return
        }

        statusDiv.textContent = `${detectedQuestions.length}টি প্রশ্ন পাওয়া গেছে`
        displayQuestionsList(detectedQuestions)
        showNotification(`Found ${detectedQuestions.length} questions on the page`, "success")
      })
    })
  }

  // Display questions in the popup
  function displayQuestionsList(questions) {
    log(`Displaying ${questions.length} questions in list`)
    questionList.innerHTML = ""

    questions.forEach((question, index) => {
      const li = document.createElement("li")
      li.textContent = question
      li.dataset.index = index

      li.addEventListener("click", () => {
        selectQuestion(index)
      })

      questionList.appendChild(li)
    })

    questionsContainer.classList.remove("hidden")
  }

  // Select a question
  function selectQuestion(index) {
    log(`Selecting question at index ${index}`)
    selectedQuestionIndex = index

    // Update UI
    const items = questionList.querySelectorAll("li")
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add("selected")
      } else {
        item.classList.remove("selected")
      }
    })

    // Display answer if available
    if (currentAnswers[index]) {
      answerContent.textContent = currentAnswers[index]
      answerContainer.classList.remove("hidden")
      log("Displaying existing answer")
    } else {
      answerContainer.classList.add("hidden")
      log("No answer available for this question")
    }
  }

  // Generate answers for all questions
  function generateAllAnswers() {
    if (detectedQuestions.length === 0) {
      const errorMsg = "No questions to generate answers for"
      statusDiv.textContent = errorMsg
      log(errorMsg)
      showNotification(errorMsg, "warning")
      return
    }

    statusDiv.textContent = "Generating answers..."
    log(`Generating answers for ${detectedQuestions.length} questions`)
    generateAllBtn.disabled = true

    const settings = getSettings()
    log(`Using settings: ${JSON.stringify(settings)}`)

    chrome.runtime.sendMessage(
      {
        action: "generateAnswers",
        questions: detectedQuestions,
        settings: settings,
      },
      (response) => {
        generateAllBtn.disabled = false

        if (!response || !response.success) {
          const errorMsg = `Error: ${response?.error || "Unknown error"}`
          statusDiv.textContent = errorMsg
          log(errorMsg)
          showNotification(errorMsg, "error")
          return
        }

        currentAnswers = response.answers
        log(`Generated ${currentAnswers.length} answers successfully`)
        statusDiv.textContent = "Answers generated successfully"
        
        // Increment question count for each question answered
        for (let i = 0; i < detectedQuestions.length; i++) {
          incrementQuestionCount()
        }

        showNotification(`Successfully generated ${currentAnswers.length} answers!`, "success")

        // Display the first answer
        if (currentAnswers.length > 0) {
          selectQuestion(0)
        }
      },
    )
  }

  // Generate answer for manual input
  function generateManualAnswer() {
    currentManualQuestion = manualInput.value.trim()

    if (!currentManualQuestion) {
      showNotification("Please enter a question", "warning")
      log("Manual generation attempted with empty question")
      return
    }

    log(`Generating answer for manual question: ${currentManualQuestion}`)
    manualGenerateBtn.disabled = true

    // Show loading state
    answerContainer.classList.remove("hidden")
    answerContent.textContent = "Generating answer..."

    const settings = getSettings()
    log(`Using settings: ${JSON.stringify(settings)}`)

    chrome.runtime.sendMessage(
      {
        action: "generateAnswer",
        question: currentManualQuestion,
        settings: settings,
      },
      (response) => {
        manualGenerateBtn.disabled = false

        if (!response || !response.success) {
          const errorMsg = `Error: ${response?.error || "Unknown error"}`
          answerContent.textContent = errorMsg
          log(errorMsg)
          showNotification(errorMsg, "error")
          return
        }

        currentManualAnswer = response.answer
        log("Answer generated successfully")
        answerContent.textContent = currentManualAnswer
        answerContainer.classList.remove("hidden")
        manualDisplayBtn.disabled = false
        
        // Increment question count
        incrementQuestionCount()
        
        showNotification("Answer generated successfully!", "success")
      },
    )
  }

  // Display all answers on the page
  function displayAllAnswersOnPage() {
    if (detectedQuestions.length === 0 || currentAnswers.length === 0) {
      const errorMsg = "No answers to display"
      statusDiv.textContent = errorMsg
      log(errorMsg)
      showNotification(errorMsg, "warning")
      return
    }

    statusDiv.textContent = "Displaying answers on the page..."
    log("Displaying all answers on the page")

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        const errorMsg = "Error: Cannot access the current tab"
        statusDiv.textContent = errorMsg
        log(errorMsg)
        showNotification(errorMsg, "error")
        return
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "displayAnswers",
          questions: detectedQuestions,
          answers: currentAnswers,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            const errorMsg = `Error: ${chrome.runtime.lastError.message}`
            statusDiv.textContent = errorMsg
            log(errorMsg)
            showNotification(errorMsg, "error")
            return
          }

          if (!response || !response.success) {
            const errorMsg = "Error displaying answers on the page"
            statusDiv.textContent = errorMsg
            log(errorMsg)
            showNotification(errorMsg, "error")
            return
          }

          statusDiv.textContent = "Answers displayed on the page"
          log("Answers displayed successfully on the page")
          showNotification("Answers displayed on the page successfully!", "success")
        },
      )
    })
  }

  // Display manual answer on the page
  function displayManualAnswerOnPage() {
    if (!currentManualQuestion || !currentManualAnswer) {
      showNotification("Please generate an answer first", "warning")
      log("Attempted to display manual answer without generating one first")
      return
    }

    log("Displaying manual answer on the page")

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        const errorMsg = "Error: Cannot access the current tab"
        showNotification(errorMsg, "error")
        log(errorMsg)
        return
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "displaySingleAnswer",
          question: currentManualQuestion,
          answer: currentManualAnswer,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            const errorMsg = `Error: ${chrome.runtime.lastError.message}`
            showNotification(errorMsg, "error")
            log(errorMsg)
            return
          }

          if (!response || !response.success) {
            const errorMsg = "Error displaying answer on the page"
            showNotification(errorMsg, "error")
            log(errorMsg)
            return
          }

          log("Manual answer displayed successfully on the page")
          showNotification("Answer displayed on the page successfully!", "success")
        },
      )
    })
  }

  // Copy answer to clipboard
  function copyAnswerToClipboard() {
    const textToCopy = answerContent.textContent

    if (!textToCopy) {
      log("Attempted to copy empty answer")
      return
    }

    log("Copying answer to clipboard")
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        const originalText = copyAnswerBtn.textContent
        copyAnswerBtn.textContent = "Copied!"
        log("Answer copied to clipboard successfully")
        showNotification("Answer copied to clipboard!", "success", 2000)

        setTimeout(() => {
          copyAnswerBtn.textContent = originalText
        }, 2000)
      })
      .catch((err) => {
        log(`Failed to copy text: ${err}`)
        showNotification("Failed to copy text", "error")
        console.error("Failed to copy text: ", err)
      })
  }

  // Event listeners
  scanBtn.addEventListener("click", scanPage)
  generateAllBtn.addEventListener("click", generateAllAnswers)
  displayAllBtn.addEventListener("click", displayAllAnswersOnPage)
  manualGenerateBtn.addEventListener("click", generateManualAnswer)
  manualDisplayBtn.addEventListener("click", displayManualAnswerOnPage)
  copyAnswerBtn.addEventListener("click", copyAnswerToClipboard)

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "questionsDetected") {
      detectedQuestions = message.questions
      log(`Received ${detectedQuestions.length} questions from content script`)
      statusDiv.textContent = `${detectedQuestions.length} প্রশ্ন পাওয়া গেছে`
      displayQuestionsList(detectedQuestions)
    }
  })

  // Save session time when popup closes
  window.addEventListener('beforeunload', saveSessionTime)

  // Update usage stats periodically
  setInterval(updateUsageStats, 30000) // Update every 30 seconds

  // Initialize
  log("Initializing popup")
  loadSettings()
  updateUsageStats()
  scanPage()
  
  // Show welcome notification
  setTimeout(() => {
    showNotification("Welcome to Babel AI Assistant! Ready to help with your questions.", "info", 3000)
  }, 1000)
})