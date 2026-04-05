import { useState, useEffect } from 'react'
import { MessageSquare, LogOut, Plus, Search, User, Trash2, PanelLeftClose } from 'lucide-react'

const API_BASE = 'http://localhost:5000/api'

function Sidebar({ user, onLogout, onSelectSession, isSidebarOpen, onToggleSidebar, onDeleteSession }) {
  const [chatHistory, setChatHistory] = useState([])

  useEffect(() => {
    if (user && isSidebarOpen) {
      fetchChatHistory()
    }
  }, [user, isSidebarOpen])

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

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation()
    // Optimistic UI update
    setChatHistory(prev => prev.filter(c => c.session_id !== sessionId))
    onDeleteSession(sessionId)
  }

  const truncateText = (text, maxLength = 30) => {
    return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div className={`w-[300px] flex-shrink-0 h-full bg-[#030712] border-r border-slate-800 flex flex-col shadow-2xl z-30 transition-all duration-300 transform`}>
      {/* Sidebar Header Action Items */}
      <div className="p-6 mb-2 flex items-center justify-between gap-4">
        <button 
          onClick={() => onSelectSession(null)}
          className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-600/30"
        >
          <Plus size={20} /> New chat
        </button>
        <button 
           onClick={onToggleSidebar}
           title="Close sidebar"
           className="p-3 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>

      <div className="px-6 mb-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search chats..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
        </div>
      </div>

      {/* Main Thread Content Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-slate-800 hover:scrollbar-thumb-slate-700">
        <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-[0.15em] mb-4 px-4 opacity-70">
          Last 30 Days
        </div>
        
        {chatHistory.length === 0 ? (
          <div className="px-4 py-8 text-center bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
             <MessageSquare size={24} className="mx-auto text-slate-700 mb-3" />
             <p className="text-slate-500 text-sm italic font-medium">No threads yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {chatHistory.map((chat, index) => (
              <div 
                key={index}
                className="group relative flex items-center rounded-xl hover:bg-slate-900/50 transition-all border border-transparent hover:border-slate-800 focus-within:bg-slate-900/80"
              >
                <button
                  onClick={() => onSelectSession(chat.session_id)}
                  className="flex-1 flex items-center px-4 py-3.5 text-left text-slate-300 text-[14px] leading-relaxed group-hover:text-slate-100 transition-colors overflow-hidden rounded-xl"
                >
                  <div className="truncate font-medium">{truncateText(chat.message, 32)}</div>
                </button>
                <button 
                  onClick={(e) => handleDelete(e, chat.session_id)}
                  className="absolute right-3 opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Archive Thread"
                >
                   <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Information Fixed Footer Block */}
      <div className="p-6 border-t border-slate-800/60 bg-[#030712]/50 backdrop-blur-sm">
        <div className="flex items-center justify-between hover:bg-slate-800/40 p-3 rounded-2xl transition-all cursor-pointer group active:scale-95">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-indigo-600/20 shadow-md ring-1 ring-slate-800">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
             </div>
             <div className="flex flex-col overflow-hidden">
               <span className="text-[14px] text-slate-100 font-bold leading-none truncate">{user?.name || 'User Profile'}</span>
               <span className="text-[11px] text-slate-500 mt-1 font-medium tracking-tight truncate">{user?.email || 'unregistered_apex'}</span>
             </div>
           </div>
           
           <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-xl hover:bg-red-500/10" title="Sign Out">
              <LogOut size={18} />
           </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
