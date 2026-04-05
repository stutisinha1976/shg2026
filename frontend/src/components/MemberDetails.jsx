import { Brain, Lightbulb } from 'lucide-react'
import './MemberDetails.css'

const SCORE_COLORS = {
  green: '#22c55e', orange: '#f59e0b', red: '#ef4444', blue: '#6366f1', cyan: '#06b6d4',
}

function ScoreBar({ label, value, max = 100, color }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="score-bar">
      <div className="score-bar-header">
        <span className="score-bar-label">{label}</span>
        <span className="score-bar-value" style={{ color }}>{typeof value === 'number' ? value.toFixed(1) : value}/{max}</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function MemberDetails({ memberAnalysis }) {
  if (!memberAnalysis || Object.keys(memberAnalysis).length === 0) return null
  const members = Object.entries(memberAnalysis)

  return (
    <div className="members-card glass-card">
      <h3 className="section-title"><span className="icon"><Brain size={18} className='inline-block mr-1' /></span>AI Explainability (XAI) & Member Scores</h3>
      <div className="members-grid">
        {members.map(([name, data]) => {
          const xai = data.xai_report || {}
          const cr = data.credit_data || {}
          return (
            <div key={name} className="member-detail-card">
              <div className="member-detail-header">
                <h4>{name}</h4>
                <span className={`badge badge-${cr.category === 'Excellent' || cr.category === 'Good' ? 'green' :
                  cr.category === 'Fair' ? 'orange' : 'red'}`}>
                  {cr.category} ({cr.credit_score}/900)
                </span>
              </div>

              <div className="member-scores">
                <ScoreBar label="SHG Score" value={data.shg_score} color={SCORE_COLORS.blue} />
                <ScoreBar label="Behavioral" value={data.behavioral_score} color={SCORE_COLORS.cyan} />
                <ScoreBar label="Inclusion" value={data.inclusion_score} color={SCORE_COLORS.green} />
                <ScoreBar label="Approval Chance" value={(cr.loan_approval_chance || 0) * 100} color={SCORE_COLORS.orange} />
              </div>

              <div className="xai-section">
                <p className="xai-reason">{xai.plain_english_reason}</p>

                {xai.top_positive_factors?.length > 0 && (
                  <div className="xai-factors">
                    {xai.top_positive_factors.map((f, i) => (
                      <div key={i} className="xai-factor positive">{f}</div>
                    ))}
                  </div>
                )}
                {xai.top_negative_factors?.length > 0 && (
                  <div className="xai-factors">
                    {xai.top_negative_factors.map((f, i) => (
                      <div key={i} className="xai-factor negative">{f}</div>
                    ))}
                  </div>
                )}

                {xai.improvement_roadmap?.length > 0 && (
                  <div className="xai-roadmap">
                    <span className="xai-roadmap-title"><Lightbulb size={18} className='inline-block mr-1' /> Improvement Roadmap</span>
                    {xai.improvement_roadmap.map((tip, i) => (
                      <div key={i} className="xai-roadmap-item">→ {tip}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
