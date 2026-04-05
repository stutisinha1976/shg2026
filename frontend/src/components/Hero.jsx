import './Hero.css'

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Powered by Gemini AI
        </div>

        <h1 className="hero-title">
          <span className="hero-title-line">SHG Ledger</span>
          <span className="hero-title-gradient">Analyzer</span>
        </h1>

        <p className="hero-subtitle">
          Upload your Self Help Group ledger image and get instant AI-powered
          financial analysis — fraud detection, credit forecasts, risk assessment,
          loan recommendations, and government scheme eligibility.
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">5+</span>
            <span className="hero-stat-label">Analysis Modules</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">AI</span>
            <span className="hero-stat-label">Gemini Powered</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">PDF</span>
            <span className="hero-stat-label">Report Export</span>
          </div>
        </div>

        <a href="#upload-section" className="hero-scroll-btn">
          <span>Start Analysis</span>
          <span className="hero-scroll-arrow">↓</span>
        </a>
      </div>

      {/* Decorative floating elements */}
      <div className="hero-float hero-float-1">📊</div>
      <div className="hero-float hero-float-2">🏦</div>
      <div className="hero-float hero-float-3">📈</div>
      <div className="hero-float hero-float-4">💰</div>
    </section>
  )
}
