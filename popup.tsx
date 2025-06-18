"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function Popup() {
  // Pre-configured with the provided API key
  const [apiKey, setApiKey] = useState("AIzaSyBXSl3egXRahZUnE4sJiJuOzFcWG2tZUFU")
  const [selectedText, setSelectedText] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Get selected text from the active tab
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" }, (response) => {
          if (response && response.selectedText) {
            setSelectedText(response.selectedText)
          }
        })
      })
    }
  }, [])

  const saveApiKey = () => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ gemini_api_key: apiKey })
    }
  }

  const getAIResponse = async () => {
    if (!apiKey) {
      setError("Please enter your Google AI Studio API key")
      return
    }

    if (!selectedText) {
      setError("No text selected. Please select text on the webpage.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Using Google's Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: selectedText }],
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

      if (data.error) {
        setError(data.error.message || "Error from Google AI API")
      } else if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        setResponse(data.candidates[0].content.parts[0].text)
      } else {
        setError("Unexpected response format from Google AI")
      }
    } catch (err) {
      setError("Error connecting to Google AI API")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-96 p-4 bg-white">
      <h1 className="text-xl font-bold mb-4">Google AI Text Analyzer</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Google AI Studio API Key</label>
        <div className="flex gap-2">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Google AI Studio API key"
          />
          <Button onClick={saveApiKey} size="sm">
            Save
          </Button>
        </div>
      </div>

      <Card className="p-3 mb-4 bg-gray-50 max-h-32 overflow-y-auto">
        <p className="text-sm font-medium mb-1">Selected Text:</p>
        <p className="text-sm">{selectedText || "No text selected"}</p>
      </Card>

      <Button onClick={getAIResponse} disabled={loading || !selectedText} className="w-full mb-4">
        {loading ? "Getting Answer..." : "Get AI Answer"}
      </Button>

      {error && <div className="mb-4 p-2 bg-red-50 text-red-500 rounded text-sm">{error}</div>}

      {response && (
        <Card className="p-3 bg-blue-50 max-h-64 overflow-y-auto">
          <p className="text-sm font-medium mb-1">AI Response:</p>
          <p className="text-sm whitespace-pre-line">{response}</p>
        </Card>
      )}
    </div>
  )
}
