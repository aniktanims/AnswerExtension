// This script runs in the background
chrome.runtime.onInstalled.addListener(() => {
  console.log("Bengali AI Assistant installed")

  // Set default settings
  chrome.storage.sync.set({
    apiKey: "AIzaSyBXSl3egXRahZUnE4sJiJuOzFcWG2tZUFU",
    model: "gemini-1.5-flash",
    questionSelector: ".text-xl",
    autoDetect: true,
    respondBengali: true,
  })
})

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request.action)

  if (request.action === "generateAnswer") {
    generateAnswer(request.question, request.settings)
      .then((answer) => {
        console.log("Answer generated successfully")
        sendResponse({ success: true, answer: answer })
      })
      .catch((error) => {
        console.error("Error generating answer:", error)
        sendResponse({ success: false, error: error.message })
      })
    return true // Required for async sendResponse
  }

  if (request.action === "generateAnswers") {
    generateAnswers(request.questions, request.settings)
      .then((answers) => {
        console.log("All answers generated successfully")
        sendResponse({ success: true, answers: answers })
      })
      .catch((error) => {
        console.error("Error generating answers:", error)
        sendResponse({ success: false, error: error.message })
      })
    return true // Required for async sendResponse
  }
})

// Generate answer for a single question
async function generateAnswer(question, settings) {
  try {
    console.log("Generating answer for:", question)
    console.log("Using settings:", settings)

    // Check if we have a cached answer
    const cacheKey = `${question}_${settings.model}_${settings.respondBengali}`
    const cache = await chrome.storage.local.get([cacheKey])

    if (cache[cacheKey]) {
      console.log("Using cached answer for:", question)
      return cache[cacheKey]
    }

    // Call Google AI API
    const answer = await callGeminiAPI(question, settings)

    // Cache the answer
    await chrome.storage.local.set({ [cacheKey]: answer })

    return answer
  } catch (error) {
    console.error("Error in generateAnswer:", error)
    throw error
  }
}

// Generate answers for multiple questions
async function generateAnswers(questions, settings) {
  try {
    console.log(`Generating answers for ${questions.length} questions`)
    const answers = []

    for (const question of questions) {
      try {
        const answer = await generateAnswer(question, settings)
        answers.push(answer)
      } catch (error) {
        console.error(`Error generating answer for question: ${question}`, error)
        answers.push(`Error: ${error.message}`)
      }
    }

    return answers
  } catch (error) {
    console.error("Error in generateAnswers:", error)
    throw error
  }
}

// Call Google AI API (Gemini)
async function callGeminiAPI(question, settings) {
  try {
    const apiKey = settings.apiKey
    const model = settings.model || "gemini-1.5-flash"
    const respondBengali = settings.respondBengali

    console.log(`Calling Gemini API with model: ${model}`)

    const prompt = respondBengali
      ? `Please answer this question in Bengali. Be thorough and informative: ${question}`
      : `Please answer this question. Be thorough and informative: ${question}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 800,
          },
        }),
      },
    )

    const data = await response.json()
    console.log("API response received:", data)

    if (data.error) {
      console.error("API error:", data.error)
      throw new Error(data.error.message || "Error from Google AI API")
    }

    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
    ) {
      return data.candidates[0].content.parts[0].text
    } else {
      console.error("Unexpected API response format:", data)
      throw new Error("Unexpected response format from Google AI")
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    throw error
  }
}
