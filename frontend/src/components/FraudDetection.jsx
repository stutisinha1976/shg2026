import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '../contexts/TranslationContext'
import './FraudDetection.css'

export default function FraudDetection({ data }) {
  const { t } = useTranslation();
  if (!data) return null

  const riskLevel = data.risk_level || 'Low'
  const riskScore = data.risk_score || 0
  const alerts = data.alerts || []
  const isClean = riskLevel === 'Low' && alerts.length === 0

  const riskColor = riskLevel === 'Low' ? 'var(--green)' :
                    riskLevel === 'Medium' ? 'var(--orange)' : 'var(--red)'

  return (
    <div className="fraud-card glass-card">
      <div className="fraud-header">
        <h3 className="section-title"><span className="icon">🛡️</span>{t("Fraud Detection")}</h3>
        <div className={`fraud-status ${isClean ? 'fraud-clean' : 'fraud-alert'}`}>
          <span className="fraud-status-dot" />
          {isClean ? t('No Fraud Detected') : `${t(riskLevel)} ${t('Risk')}`}
        </div>
      </div>

      {/* Risk Score Bar */}
      <div className="fraud-score-bar">
        <div className="fraud-score-label">
          <span>{t("Risk Score")}</span>
          <span style={{ color: riskColor, fontWeight: 700 }}>{riskScore}/100</span>
        </div>
        <div className="fraud-score-track">
          <div className="fraud-score-fill" style={{
            width: `${riskScore}%`,
            background: riskColor,
            boxShadow: `0 0 12px ${riskColor}`
          }} />
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="fraud-alerts">
          <h4 className="fraud-alerts-title"><AlertTriangle size={18} className='inline-block mr-1' /> {t("Alerts")} ({alerts.length})</h4>
          {alerts.map((alert, i) => (
            <div key={i} className={`fraud-alert-item severity-${alert.severity?.toLowerCase()}`}>
              <span className="alert-severity">{t(alert.severity)}</span>
              <span className="alert-type">{t(alert.type?.replace(/_/g, ' '))}</span>
              <p className="alert-message">{t(alert.message)}</p>
            </div>
          ))}
        </div>
      )}

      {isClean && (
        <div className="fraud-clean-banner">
          <div className="fraud-clean-icon">✓</div>
          <div>
            <strong>{t("All Clear")}</strong>
            <p>{t("No suspicious patterns, anomalies, or duplicate transactions detected.")}</p>
          </div>
        </div>
      )}
    </div>
  )
}
