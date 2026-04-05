import { useState, useRef, useEffect } from 'react'
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
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Initialize messages based on activeChatData or context
  useEffect(() => {
    if (activeChatData) {
      // Restore past chat session
      setMessages([
        { role: 'user', content: activeChatData.message },
        { role: 'assistant', content: activeChatData.response }
      ])
    } else {
      // Start a fresh session
      const greeting = context 
        ? "Hello! Ledger data loaded. I'm ready to answer any specific follow-up questions you have relevant to this ledger."
        : "Hello! I'm your SHG Finance Assistant powered by Gemini AI. Ask me anything about microfinance, SHG operations, or credit management."
      
      setMessages([{ role: 'assistant', content: greeting }])
    }
  }, [activeChatData, context])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Dynamic suggestions based on context presence
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
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
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
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestion = (q) => {
    sendMessage(q)
  }

  return (
    <div className="chatbot-panel glass-card">
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <span className="chatbot-avatar">🤖</span>
          <div>
            <h3 className="chatbot-title">Finance Assistant</h3>
            <span className="chatbot-subtitle">Powered by Gemini AI</span>
          </div>
        </div>
        <button className="chatbot-close" onClick={onClose}>✕</button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message chat-${msg.role}`}>
            {msg.role === 'assistant' && <span className="chat-bot-icon">🤖</span>}
            <div className="chat-bubble">
              {msg.content.split('\n').map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message chat-assistant">
            <span className="chat-bot-icon">🤖</span>
            <div className="chat-bubble chat-typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && !activeChatData && (
        <div className="chatbot-suggestions">
          {currentSuggestions.map((q, i) => (
            <button
              key={i}
              className="chatbot-suggestion"
              onClick={() => handleSuggestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form className="chatbot-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="chatbot-input"
          placeholder="Ask about SHG finance..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="chatbot-send"
          disabled={!input.trim() || isLoading}
        >
          ↑
        </button>
      </form>
    </div>
  )
}
