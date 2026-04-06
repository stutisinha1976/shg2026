import { useTranslation } from '../contexts/TranslationContext'
import './GovernmentSchemes.css'

export default function GovernmentSchemes({ schemes }) {
  const { t } = useTranslation();
  if (!schemes || typeof schemes !== 'object') return null

  // schemes is { memberName: [{ scheme_name, max_amount, rate, description }] }
  const entries = Object.entries(schemes)
  if (entries.length === 0) return null

  return (
    <div className="schemes-card glass-card">
      <h3 className="section-title"><span className="icon">🏛️</span>{t("Government Scheme Eligibility")}</h3>
      <div className="schemes-members">
        {entries.map(([member, memberSchemes]) => (
          <div key={member} className="schemes-member-block">
            <div className="schemes-member-header">
              <h4>{member}</h4>
              <span className="schemes-count">{memberSchemes.length} {t("schemes")}</span>
            </div>
            <div className="schemes-grid">
              {memberSchemes.map((s, i) => (
                <div key={i} className="scheme-item">
                  <div className="scheme-header">
                    <span className="scheme-number">{i + 1}</span>
                    <h5 className="scheme-name">{t(s.scheme_name)}</h5>
                  </div>
                  <p className="scheme-description">{t(s.description)}</p>
                  <div className="scheme-meta">
                    <span className="scheme-tag">{t("Max")}: {t(s.max_amount)}</span>
                    <span className="scheme-tag">{t("Rate")}: {t(s.rate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
