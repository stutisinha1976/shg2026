import { useState, useRef, useEffect, useMemo } from 'react'
import { Square, Play, Mic, Octagon, VolumeX, Volume2, Bot, Send, Paperclip, Globe } from 'lucide-react'
import ResultsDashboard from './ResultsDashboard'
import { NGramEngine } from '../utils/ngram'
import ShapeGrid from './ShapeGrid'
import { useTranslation } from '../contexts/TranslationContext'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' }
]

export default function MainChatView({ session, onUploadImage, onSendMessage, isLoading, selectedLanguage = 'en' }) {
  const [input, setInput] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState(null)
  
  const { t } = useTranslation()

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const languageMenuRef = useRef(null)



  // Initialize N-Gram Engine
  const ngramModel = useMemo(() => {
    const engine = new NGramEngine(3)

    // Default SHG finance corpus
    const corpus = [
      "What is the ideal savings to loan ratio for an SHG?",
      "How can members improve their credit scores?",
      "Explain the DAY-NRLM scheme benefits",
      "What are the signs of financial fraud in SHGs?",
      "How to calculate EMI for a micro loan?",
      "What are the types of financial frauds?",
      "Show me the risk assessment for this ledger",
      "Analyze the member contributions"
    ]

    // Inject chat history dynamics securely into Corpus mapping
    if (session && session.messages) {
      session.messages.forEach(msg => {
        if (msg.role === 'user' || msg.message) {
          // If message isn't a file upload standard string
          if (!msg.message.includes("📎")) {
            corpus.push(msg.message)
          }
        }
      })
    }

    engine.train(corpus)
    return engine
  }, [session])

  // Update NGram Prediction immediately on Input change
  useEffect(() => {
    if (input.trim().length > 0) {
      const completion = ngramModel.predict(input)
      setSuggestion(completion)
    } else {
      setSuggestion('')
    }
  }, [input, ngramModel])

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      setInput(prev => prev + suggestion)
      setSuggestion('')
    }
  }

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
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (session?.messages?.length > 0) {
      const lastMsg = session.messages[session.messages.length - 1];
      if (lastMsg && lastMsg.context && lastMsg.response && lastMsg.response.includes("Ledger analysis complete")) {
        // Prevent hijacking scroll if a massive dashboard just arrived
        return;
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages, isLoading])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (!recognitionRef.current) return alert("Speech Recognition not supported.")
      try { recognitionRef.current.start(); setIsListening(true) } catch (e) { }
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) return alert('Please upload a valid image.')
    if (file.size > 10 * 1024 * 1024) return alert('File size must be under 10MB.')
    onUploadImage(file)
    e.target.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSendMessage(input)
    setInput('')
    setSuggestion('')
  }

  const speakText = (text, index) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = selectedLanguage === 'en' ? 'en-US' : `${selectedLanguage}-IN`
    utterance.onend = () => setSpeakingIndex(null)
    setSpeakingIndex(index)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setSpeakingIndex(null)
  }

  // Pre-process messages from session into a renderable UI stream. 
  const displayMessages = []
  const isEmptyState = !session || !session.messages || session.messages.length === 0

  if (!isEmptyState) {
    session.messages.forEach((msg, idx) => {
      displayMessages.push({ role: 'user', content: msg.message, id: `u-${idx}` })


      const isLedgerAnalysis = msg.response && msg.response.includes("Ledger analysis complete")

      if (msg.response) {
        displayMessages.push({
          role: 'assistant',
          content: msg.response,
          context: isLedgerAnalysis ? msg.context : null,
          id: `a-${idx}`
        })
      }
    })
  }

  // Common Input bar renderer
  const renderInputForm = (isCentered = false) => (
    <div className={`w-full max-w-4xl mx-auto flex flex-col gap-6 ${isCentered ? 'mt-12' : 'px-8 mb-12 mt-8'}`}>
      <form onSubmit={handleSubmit} className="w-full bg-black/40 backdrop-blur-md border border-gray-800 rounded-2xl p-4 flex gap-4 items-center focus-within:bg-black/60 focus-within:border-gray-600 shadow-xl relative transition-all min-h-[64px] hover:border-gray-700">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/jpeg,image/png,image/webp" />

        <div className="flex gap-3">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-300 flex-shrink-0" title="Attach Image">
            <Paperclip size={20} />
          </button>
        </div>

        {/* Input Wrapper for NGram Overlay */}
        <div className="flex-1 relative flex items-center h-[48px]">
          {/* Prediction Overlay layer */}
          <div className="absolute left-0 top-0 bottom-0 w-full flex items-center pointer-events-none px-4 whitespace-pre overflow-hidden">
            <span className="text-transparent">{input}</span>
            <span className="text-gray-600">{suggestion}</span>
          </div>

            {/* Actual Input */}
          <input
            type="text"
            className="w-full h-full bg-transparent border-none outline-none text-white placeholder-gray-600 text-base font-light px-4 relative z-10 font-georgia"
            placeholder={isListening ? t("Listening...") : t("Ask anything about SHG finance...")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={toggleListening} className={`p-3 transition-all duration-300 rounded-xl flex-shrink-0 ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30' : 'text-gray-500 hover:text-white hover:bg-gray-800 border border-transparent'}`} title="Voice Input">
            {isListening ? <Octagon size={18} /> : <Mic size={18} />}
          </button>

          <button type="submit" disabled={!input.trim() || isLoading || isListening} className="p-3 text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center flex-shrink-0 border border-transparent disabled:hover:bg-transparent">
            <Send size={18} className="rotate-90" />
          </button>
        </div>
      </form>

      {!isCentered && (
        <div className="text-center text-xs text-gray-600 flex items-center justify-center gap-8 px-4 font-normal">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
            <span>{t("Press Tab to accept predictive text")}</span>
          </div>
          <button onClick={() => setAutoSpeak(!autoSpeak)} className={`flex items-center gap-2 hover:text-white transition-all duration-300 px-4 py-2 rounded-xl font-normal ${autoSpeak ? 'text-white bg-gray-800' : ''}`}>
            {autoSpeak ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {autoSpeak ? t("Auto-Speak On") : t("Auto-Speak Off")}
          </button>
        </div>
      )}
    </div>
  )

  if (isEmptyState) {
    return (
      <div className="flex flex-col flex-1 w-full h-full bg-black justify-center items-center text-center p-8 relative overflow-hidden font-georgia">
        <div className="absolute inset-0 w-full h-full">
          <ShapeGrid
            speed={0.3}
            squareSize={50}
            direction="diagonal"
            borderColor="#1a1a1a"
            hoverColor="#2a2a2a"
            size={50}
            shape="square"
            hoverTrailAmount={0}
          />
        </div>
        <div className="max-w-4xl mx-auto w-full relative z-10">

          <div className="text-center mb-20">
            <h1 className="text-6xl md:text-7xl font-normal text-white mb-6 tracking-wide">
              {t("SHG Finance Assistant")}
            </h1>
            <p className="text-lg text-gray-400 mb-16 max-w-2xl mx-auto leading-relaxed font-normal">
              {t("Upload ledger images or ask questions about Self Help Group finance, micro-loans, and credit management.")}
            </p>
          </div>
          <div className="w-full max-w-2xl mx-auto mb-20">
            {renderInputForm(true)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden font-georgia">
      <div className="absolute inset-0 w-full h-full">
        <ShapeGrid
          speed={0.3}
          squareSize={50}
          direction="diagonal"
          borderColor="#1a1a1a"
          hoverColor="#2a2a2a"
          size={50}
          shape="square"
          hoverTrailAmount={0}
        />
      </div>



      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-10 py-10 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {displayMessages.map((msg, i) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in-up`}>

              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300
                ${msg.role === 'user'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-900 border-gray-800'}`}>
                {msg.role === 'user' ?
                  <span className="text-xs font-light text-white">U</span> :
                  <Bot size={16} className="text-gray-400" />
                }
              </div>

              {/* Message Content */}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div className={`px-5 py-3 rounded-xl text-sm leading-relaxed break-words transition-all duration-300
                  ${msg.role === 'user'
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-gray-900/60 text-gray-100 border border-gray-800'}`}>
                  {t(msg.content).split('\n').map((line, j) => (
                    <p key={j} className="min-h-[1rem] last:mb-0 font-normal leading-6">{line || '\u00A0'}</p>
                  ))}

                  {/* TTS Component rendering inline */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-gray-700/50 flex gap-2">
                      {speakingIndex === i ? (
                        <button onClick={stopSpeaking} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-300" title="Stop Reading">
                          <Square size={12} />
                        </button>
                      ) : (
                        <button onClick={() => speakText(t(msg.content), i)} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-300" title="Read Aloud">
                          <Play size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Dashboard rendered inline if present */}
                {msg.context && (
                  <div className="w-full mt-4 animate-fade-in-up text-left">
                    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden">
                      <ResultsDashboard results={msg.context} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-4 flex-row animate-fade-in-up">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center">
                <Bot size={16} className="text-gray-400" />
              </div>
              <div className="px-5 py-3 flex items-center gap-3 bg-gray-900/60 border border-gray-800 rounded-xl">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
                {session?.messages?.length > 0 && session.messages[session.messages.length - 1].message.includes("📎") && (
                  <span className="text-xs font-normal text-gray-400 animate-pulse">{t("Running advanced ledger extraction...")}</span>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-8" />
        </div>
      </div>

      {/* Input Form at bottom when active */}
      <div className="relative z-10">
        {renderInputForm()}
      </div>
    </div>
  )
}
