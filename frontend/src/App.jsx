import { useState, useRef, useEffect } from 'react'
import Hero from './components/Hero'
import UploadSection from './components/UploadSection'
import ResultsDashboard from './components/ResultsDashboard'
import Chatbot from './components/Chatbot'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import './App.css'

const API_BASE = 'http://localhost:5000/api'

function App() {
  const [user, setUser] = useState(null)
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeChat, setActiveChat] = useState(null)
  const resultsRef = useRef(null)

  // Check for existing authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (err) {
        console.error('Failed to parse user data:', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handleAuthSuccess = (authData) => {
    setUser({
      id: authData.user_id,
      email: authData.email,
      name: JSON.parse(localStorage.getItem('user'))?.name || authData.email.split('@')[0]
    })
    setError(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setResults(null)
    setShowSidebar(false)
    setError(null)
  }

  const handleUpload = async (file) => {
    setIsLoading(true)
    setError(null)
    setResults(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.results) {
        setResults(data.results)
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 300)
      } else {
        setError(data.error || 'Analysis failed. Please try again.')
      }
    } catch (err) {
      setError('Failed to connect to the server. Make sure that backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  // If not authenticated, show auth screen
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="app">
      {/* Header with profile button */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">SHG APEX Platform</h1>
          <button
            className="profile-button"
            onClick={() => setShowSidebar(!showSidebar)}
            title="Profile & History"
          >
            <div className="profile-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </button>
        </div>
      </header>

      <Hero />
      <UploadSection onUpload={handleUpload} isLoading={isLoading} />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-card glass-card">
            <div className="loading-spinner" />
            <h3>APEX v3.1 Analyzing Ledger...</h3>
            <p className="loading-steps">
              OCR → Parsing → Scoring → XAI → Fraud → Schemes
            </p>
            <p className="loading-sub">This may take 10-15 seconds</p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-card glass-card animate-fade-in-up">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>Analysis Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div ref={resultsRef}>
        {results && <ResultsDashboard results={results} />}
      </div>

      {/* Chat FAB */}
      <button
        className="chat-fab"
        onClick={() => {
          setActiveChat(null) // clear active chat context when fab is clicked
          setShowChat(!showChat)
        }}
        title="Finance Chatbot"
      >
        {showChat ? '✕' : '💬'}
      </button>

      {showChat && (
        <Chatbot
          context={results}
          activeChatData={activeChat}
          onClose={() => setShowChat(false)}
          token={localStorage.getItem('token')}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelectChat={(chat) => {
          setActiveChat(chat)
          setShowChat(true)
          setShowSidebar(false)
        }}
      />
    </div>
  )
}

export default App
