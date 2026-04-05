import { useState, useEffect } from 'react'
import { Eye, AlertTriangle, EyeOff, ArrowRight, Mail, User, X, Check, Key, Lock, ArrowLeft } from 'lucide-react'


const API_BASE = 'http://localhost:5000/api'

/* ── SVG Icons ── */
/* ── Password Strength helpers ── */
function getPasswordStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  return score
}

const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500']

function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password)

  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? strengthColors[strength - 1] : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs transition-colors duration-300 ${
        strength <= 1 ? 'text-red-400' :
        strength <= 2 ? 'text-orange-400' :
        strength <= 3 ? 'text-yellow-400' :
        strength <= 4 ? 'text-blue-400' :
        'text-emerald-400'
      }`}>
        {strengthLabels[strength - 1] || ''}
      </p>
    </div>
  )
}

/* ── Password Requirements ── */
function PasswordRequirements({ password }) {
  if (!password) return null

  const requirements = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  return (
    <div className="mt-3 grid grid-cols-2 gap-1.5">
      {requirements.map((req, i) => (
        <div key={i} className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
          req.met ? 'text-emerald-400' : 'text-slate-500'
        }`}>
          {req.met ? <Check size={20} /> : <X size={20} />}
          {req.label}
        </div>
      ))}
    </div>
  )
}

/* ── Input Component ── */
function AuthInput({ icon: Icon, label, type = 'text', id, name, value, onChange, placeholder, required = true, showToggle = false, toggleVisible, onToggle }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-200">
          <Icon />
        </div>
        <input
          type={showToggle ? (toggleVisible ? 'text' : 'password') : type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 text-sm"
          autoComplete={type === 'password' ? 'current-password' : 'off'}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-200 focus:outline-none bg-transparent m-0 p-0"
            tabIndex={-1}
          >
            {toggleVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════
   Main Auth Component
   ═══════════════════════════════════════ */
function Auth({ onAuthSuccess }) {
  // 'login' | 'register' | 'forgot' | 'reset-token'
  const [view, setView] = useState('login')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    resetToken: '',
    newPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Clear messages on view change
  useEffect(() => {
    setError('')
    setSuccess('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setShowNewPassword(false)
  }, [view])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify({
          id: data.user_id,
          email: data.email,
          name: data.email.split('@')[0],
        }))
        onAuthSuccess(data)
      } else {
        setError(data.error || data.message || 'Invalid credentials')
      }
    } catch {
      setError('Failed to connect to server. Is the backend running?')
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Register ── */
  const handleRegister = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify({
          id: data.user_id,
          email: data.email,
          name: formData.name || data.email.split('@')[0],
        }))
        onAuthSuccess(data)
      } else {
        setError(data.error || data.message || 'Registration failed')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Request Reset ── */
  const handleRequestReset = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Reset token generated! Check below for the token (in production this would be emailed).')
        // For dev: auto-fill the reset token if returned
        if (data.reset_token) {
          setFormData(prev => ({ ...prev, resetToken: data.reset_token }))
        }
        setView('reset-token')
      } else {
        setError(data.error || 'Failed to request reset')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Reset Password ── */
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          token: formData.resetToken,
          new_password: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Password reset successfully! You can now login with your new password.')
        setTimeout(() => {
          setView('login')
          setFormData({ email: formData.email, password: '', confirmPassword: '', name: '', resetToken: '', newPassword: '' })
        }, 2000)
      } else {
        setError(data.error || data.message || 'Password reset failed')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const switchView = (newView) => {
    setView(newView)
    setFormData({ email: formData.email, password: '', confirmPassword: '', name: '', resetToken: '', newPassword: '' })
  }

  /* ═══ Render ═══ */
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060918]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[128px] animate-pulse [animation-delay:4s]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-[fadeInUp_0.6s_ease_forwards]">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/25 mb-4">
            <span className="text-2xl font-black text-white">SHG</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            APEX Platform
          </h1>
          <p className="text-slate-500 text-sm mt-1">Self Help Group Ledger Analysis</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 p-8">
          {/* ───── LOGIN VIEW ───── */}
          {view === 'login' && (
            <div className="animate-[fadeIn_0.3s_ease_forwards]">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">Welcome back</h2>
                <p className="text-slate-400 text-sm mt-1">Sign in to your dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <AuthInput
                  icon={Mail}
                  label="Email"
                  type="email"
                  id="login-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />

                <AuthInput
                  icon={Lock}
                  label="Password"
                  type="password"
                  id="login-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  showToggle
                  toggleVisible={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />

                {/* Forgot password link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchView('forgot')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && <ErrorAlert message={error} />}
                {success && <SuccessAlert message={success} />}

                <SubmitButton isLoading={isLoading} text="Sign In" loadingText="Signing in..." />
              </form>

              <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
                <p className="text-slate-500 text-sm">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-200"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ───── REGISTER VIEW ───── */}
          {view === 'register' && (
            <div className="animate-[fadeIn_0.3s_ease_forwards]">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">Create account</h2>
                <p className="text-slate-400 text-sm mt-1">Join the SHG APEX Platform</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <AuthInput
                  icon={User}
                  label="Full Name"
                  type="text"
                  id="register-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />

                <AuthInput
                  icon={Mail}
                  label="Email"
                  type="email"
                  id="register-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />

                <div>
                  <AuthInput
                    icon={Lock}
                    label="Password"
                    type="password"
                    id="register-password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    showToggle
                    toggleVisible={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                  <PasswordStrengthBar password={formData.password} />
                  <PasswordRequirements password={formData.password} />
                </div>

                <AuthInput
                  icon={Lock}
                  label="Confirm Password"
                  type="password"
                  id="register-confirm-password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  showToggle
                  toggleVisible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <X size={20} /> Passwords do not match
                  </p>
                )}

                {error && <ErrorAlert message={error} />}

                <SubmitButton isLoading={isLoading} text="Create Account" loadingText="Creating account..." />
              </form>

              <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
                <p className="text-slate-500 text-sm">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-200"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ───── FORGOT PASSWORD VIEW ───── */}
          {view === 'forgot' && (
            <div className="animate-[fadeIn_0.3s_ease_forwards]">
              <button
                type="button"
                onClick={() => switchView('login')}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors duration-200"
              >
                <ArrowLeft size={20} /> Back to sign in
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">Reset password</h2>
                <p className="text-slate-400 text-sm mt-1">Enter your email to receive a reset token</p>
              </div>

              <form onSubmit={handleRequestReset} className="space-y-4">
                <AuthInput
                  icon={Mail}
                  label="Email Address"
                  type="email"
                  id="reset-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />

                {error && <ErrorAlert message={error} />}
                {success && <SuccessAlert message={success} />}

                <SubmitButton isLoading={isLoading} text="Send Reset Token" loadingText="Sending..." />
              </form>
            </div>
          )}

          {/* ───── RESET TOKEN VIEW ───── */}
          {view === 'reset-token' && (
            <div className="animate-[fadeIn_0.3s_ease_forwards]">
              <button
                type="button"
                onClick={() => switchView('forgot')}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors duration-200"
              >
                <ArrowLeft size={20} /> Back
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">Enter reset token</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Paste the token and set your new password
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <AuthInput
                  icon={Key}
                  label="Reset Token"
                  type="text"
                  id="reset-token"
                  name="resetToken"
                  value={formData.resetToken}
                  onChange={handleChange}
                  placeholder="Paste your reset token"
                />

                <div>
                  <AuthInput
                    icon={Lock}
                    label="New Password"
                    type="password"
                    id="new-password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter your new password"
                    showToggle
                    toggleVisible={showNewPassword}
                    onToggle={() => setShowNewPassword(!showNewPassword)}
                  />
                  <PasswordStrengthBar password={formData.newPassword} />
                  <PasswordRequirements password={formData.newPassword} />
                </div>

                {error && <ErrorAlert message={error} />}
                {success && <SuccessAlert message={success} />}

                <SubmitButton isLoading={isLoading} text="Reset Password" loadingText="Resetting..." />
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          SHG APEX v3.1 &middot; Powered by AI
        </p>
      </div>
    </div>
  )
}


/* ── Shared sub-components ── */
function ErrorAlert({ message }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-[fadeIn_0.2s_ease]">
      <span className="text-base mt-0.5"><AlertTriangle size={18} className='inline-block mr-1' /></span>
      <span>{message}</span>
    </div>
  )
}

function SuccessAlert({ message }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-[fadeIn_0.2s_ease]">
      <span className="text-base mt-0.5">✅</span>
      <span>{message}</span>
    </div>
  )
}

function SubmitButton({ isLoading, text, loadingText }) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingText}
        </>
      ) : (
        text
      )}
    </button>
  )
}


export default Auth
