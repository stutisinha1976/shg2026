import { useState, useEffect } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import MainChatView from './components/MainChatView'
import { TranslationProvider } from './contexts/TranslationContext'
import './App.css'

const API_BASE = 'http://localhost:5000/api'

function App() {
  const [user, setUser] = useState(null)
  const [currentSession, setCurrentSession] = useState({ session_id: null, messages: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  // Check for existing authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (err) {
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
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCurrentSession({ session_id: null, messages: [] })
  }

  /* ═══ Chat Interactions ═══ */
  const handleUploadImage = async (file) => {
    setIsLoading(true)
    
    const tempMsgs = [...currentSession.messages, { message: `📎 Uploaded image: ${file.name}`, response: null }]
    setCurrentSession(prev => ({ ...prev, messages: tempMsgs }))

    const formData = new FormData()
    formData.append('image', file)
    if (currentSession.session_id) {
      formData.append('session_id', currentSession.session_id)
    }

    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (response.status === 401) {
        handleLogout()
        alert('Session expired. Please log in again.')
        return
      }

      const data = await response.json()
      if (data.success && data.results) {
        setCurrentSession({
          session_id: data.session_id || currentSession.session_id,
          messages: [
            ...currentSession.messages,
            {
               message: `📎 Uploaded image: ${file.name}`,
               response: `Ledger analysis complete! Found ${data.results.total_members || 0} members and ${data.results.total_transactions || 0} transactions. You can ask me follow-up questions about this active ledger.`,
               context: data.results 
            }
          ]
        })
      } else {
        alert(data.error || "Analysis failed")
      }
    } catch (err) {
      alert("Failed to connect to backend")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (text) => {
    setIsLoading(true)
    
    setCurrentSession(prev => ({ ...prev, messages: [...prev.messages, { message: text, response: null }] }))

    try {
      const token = localStorage.getItem('token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const payload = { message: text, session_id: currentSession.session_id, language: selectedLanguage }

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        handleLogout()
        alert('Session expired. Please log in again.')
        return
      }

      const data = await response.json()
      if (data.success) {
        setCurrentSession(prev => {
          const cleanHistory = prev.messages.filter(m => m.response !== null)
          return {
            session_id: data.session_id || prev.session_id,
            messages: [
              ...cleanHistory,
              { message: text, response: data.reply }
            ]
          }
        })
      } else {
        alert(data.error || "Chat failed")
      }
    } catch (err) {
      alert("Failed to connect to backend")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSessionFromSidebar = async (session_id) => {
    if (!session_id) {
       setCurrentSession({ session_id: null, messages: [] })
       // On mobile screens, closing the sidebar here might be good, but we match desktop behavior
       return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const response = await fetch(`${API_BASE}/history/session/${session_id}`, { headers })
      
      if (response.status === 401) {
        handleLogout()
        alert('Session expired. Please log in again.')
        return
      }

      const data = await response.json()
      if (data.success) {
         setCurrentSession({
            session_id: data.session_id,
            messages: data.messages
         })
      } else {
         alert("Failed to load session")
      }
    } catch (e) {
      alert("Failed fetching session")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (session_id) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      const response = await fetch(`${API_BASE}/history/session/${session_id}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.status === 401) {
        handleLogout()
        alert('Session expired. Please log in again.')
        return
      }
      // If the currently active session was deleted, clear the canvas
      if (currentSession.session_id === session_id) {
         setCurrentSession({ session_id: null, messages: [] })
      }
    } catch (e) {
      console.error("Failed to delete session", e)
    }
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <TranslationProvider targetLanguage={selectedLanguage}>
      <div className="flex w-full h-screen overflow-hidden bg-[#202123] text-gray-100 font-sans">
      {/* Side Navigation Block */}
      <Sidebar
        user={user}
        onLogout={handleLogout}
        onSelectSession={handleSelectSessionFromSidebar}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onDeleteSession={handleDeleteSession}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />

      {/* Main Conversation Canvas */}
      <main className="flex-1 flex flex-col h-full bg-[#060918] relative">
        {/* Toggle Sidebar Button when closed */}
        {!isSidebarOpen && (
          <div className="absolute top-4 left-4 z-50">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-[#1a2235] bg-transparent rounded-lg transition-colors border border-transparent shadow-sm"
              title="Open sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        )}
        
        <MainChatView  
           session={currentSession}
           isLoading={isLoading}
           onUploadImage={handleUploadImage}
           onSendMessage={handleSendMessage}
           selectedLanguage={selectedLanguage}
        />
      </main>
    </div>
    </TranslationProvider>
  )
}

export default App
