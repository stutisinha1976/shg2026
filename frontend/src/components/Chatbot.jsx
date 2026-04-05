import { useState, useRef, useEffect } from 'react'
import { Square, Play, Mic, Octagon, X, VolumeX, Volume2, Bot } from 'lucide-react'

import './Chatbot.css'

const API_BASE = 'http://localhost:5000/api'

const DEFAULT_SUGGESTED_QUESTIONS = [
  "What is the ideal savings-to-loan ratio for an SHG?",
  "How can members improve their credit scores?",
  "Explain the DAY-NRLM scheme benefits",
  "What are the signs of financial fraud in SHGs?",
  "How to calculate EMI for a micro-loan?",
]

export default function Chatbot({ context, activeChatData, onClose, token }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Voice feature states
  const [isListening, setIsListening] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(prev => prev + (prev.length ? ' ' : '') + transcript)
        setIsListening(false)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Initialize messages based on activeChatData or context
  useEffect(() => {
    if (activeChatData) {
      setMessages([
        { role: 'user', content: activeChatData.message },
        { role: 'assistant', content: activeChatData.response }
      ])
    } else {
      const greeting = context 
        ? "Hello! Ledger data loaded. I'm ready to answer any specific follow-up questions you have relevant to this ledger."
        : "Hello! I'm your SHG Finance Assistant powered by Gemini AI. Ask me anything about microfinance, SHG operations, or credit management."
      
      setMessages([{ role: 'assistant', content: greeting }])
      if (autoSpeak) speakText(greeting, 0)
    }
  }, [activeChatData, context])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Voice Interaction Fns
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (!recognitionRef.current) {
        alert("Speech Recognition is not supported in this browser.")
        return
      }
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const speakText = (text, index) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // stop current
      setSpeakingIndex(index)
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onend = () => setSpeakingIndex(null)
      utterance.onerror = () => setSpeakingIndex(null)
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeakingIndex(null)
    }
  }

  const currentSuggestions = context 
    ? [
        "What is the SHG score of Geeta or other members?",
        "Are there any anomalies indicating fraud in this ledger?",
        "What is the total internal lending value?",
        "Summarize the penalty and late fee collections.",
        "Which members belong to the red risk category?"
      ] 
    : DEFAULT_SUGGESTED_QUESTIONS

  const sendMessage = async (text) => {
    if (!text.trim()) return

    const userMessage = { role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsListening(false)
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeakingIndex(null)
    setIsLoading(true)

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const currentContext = activeChatData?.context || context || null;

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text.trim(),
          context: currentContext,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const replyText = data.reply
        setMessages((prev) => {
          const newIdx = prev.length
          if (autoSpeak) speakText(replyText, newIdx)
          return [...prev, { role: 'assistant', content: replyText }]
        })
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Sorry, something went wrong: ${data.error}` },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please make sure the backend is running.' },
      ])
    } finally {
      setIsLoading(false)
      if (!isListening) inputRef.current?.focus()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="chatbot-panel">
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="chatbot-avatar">
            <Bot size={20} />
          </div>
          <div className="chatbot-info">
            <h3 className="chatbot-title">Finance Assistant</h3>
            <span className="chatbot-subtitle">Powered by Gemini AI</span>
          </div>
        </div>
        <div className="chatbot-header-right">
          <button 
            className={`auto-speak-toggle ${autoSpeak ? 'active' : ''}`}
            onClick={() => setAutoSpeak(!autoSpeak)}
            title={autoSpeak ? "Auto-Speak is ON" : "Auto-Speak is OFF"}
          >
            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button className="chatbot-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="chatbot-messages">
        <div className="messages-container">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message chat-${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="message-avatar">
                  <Bot size={16} />
                </div>
              )}
              <div className={`chat-bubble ${msg.role === 'assistant' ? 'assistant-bubble' : 'user-bubble'}`}>
                <div className="message-content">
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
                
                {msg.role === 'assistant' && (
                  <div className="chat-audio-controls">
                    {speakingIndex === i ? (
                      <button onClick={stopSpeaking} className="audio-btn stop-audio" title="Stop Reading">
                        <Square size={14} />
                      </button>
                    ) : (
                      <button onClick={() => speakText(msg.content, i)} className="audio-btn play-audio" title="Read Aloud">
                        <Play size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="message-avatar user-avatar">
                  <span className="user-initial">U</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="chat-message chat-assistant">
              <div className="message-avatar">
                <Bot size={16} />
              </div>
              <div className="chat-bubble assistant-bubble typing-bubble">
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {messages.length <= 1 && !activeChatData && (
        <div className="chatbot-suggestions">
          <div className="suggestions-grid">
            {currentSuggestions.map((q, i) => (
              <button
                key={i}
                className="chatbot-suggestion"
                onClick={() => sendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chatbot-input-container">
        <form className="chatbot-input-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <button
              type="button"
              className={`mic-button ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Speak your question"}
            >
              {isListening ? <Octagon size={16} /> : <Mic size={16} />}
            </button>
            
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder={isListening ? "Listening..." : "Ask about SHG finance..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            
            <button
              type="submit"
              className="chatbot-send"
              disabled={!input.trim() || isLoading || isListening}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
