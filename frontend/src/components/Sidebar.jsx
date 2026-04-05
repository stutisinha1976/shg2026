import { useState, useEffect } from 'react'
import './Sidebar.css'

const API_BASE = 'http://localhost:5000/api'

function Sidebar({ user, onLogout, isOpen, onClose, onSelectChat }) {
  const [chatHistory, setChatHistory] = useState([])

  useEffect(() => {
    if (user && isOpen) {
      fetchChatHistory()
    }
  }, [user, isOpen])

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/history/chat?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setChatHistory(data.chats || [])
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text, maxLength = 30) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* User Profile Section */}
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="profile-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <h3>{user?.name || 'User'}</h3>
              <p>{user?.email || ''}</p>
            </div>
            <button className="close-sidebar" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Tabs - Only Chat History Now */}
        <div className="sidebar-tabs">
          <button className="tab-button active w-full">
            💬 Chat History
          </button>
        </div>

        {/* Content */}
        <div className="sidebar-content">
          <div className="chat-history">
            {chatHistory.length === 0 ? (
              <div className="empty-state">
                <p>No chat history yet</p>
              </div>
            ) : (
              chatHistory.map((chat, index) => (
                <div 
                  key={index} 
                  className="chat-item cursor-pointer hover:bg-white/5 transition-colors duration-200"
                  onClick={() => onSelectChat(chat)}
                >
                  <div className="chat-message">
                    <strong>You:</strong> {truncateText(chat.message)}
                  </div>
                  <div className="chat-response">
                    <strong>Bot:</strong> {truncateText(chat.response)}
                  </div>
                  <div className="chat-time">{formatDate(chat.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button className="logout-button" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
