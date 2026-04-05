import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import './LoanDefaultRisk.css'

const COLOR_MAP = {
  Green: '#22c55e', Orange: '#f59e0b', Red: '#ef4444',
  'Very Low': '#22c55e', Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', 'Very High': '#ef4444',
}

export default function LoanDefaultRisk({ memberAnalysis }) {
  if (!memberAnalysis || Object.keys(memberAnalysis).length === 0) return null
  const members = Object.entries(memberAnalysis)

  return (
    <div className="risk-card glass-card">
      <h3 className="section-title"><span className="icon">⚡</span>Loan Default Risk</h3>
      <div className="risk-members">
        {members.map(([name, data]) => {
          const dr = data.default_risk || {}
          const prob = typeof dr.default_probability === 'number' ? dr.default_probability : parseFloat(String(dr.default_probability || '0'))
          const color = COLOR_MAP[dr.color] || COLOR_MAP[dr.risk_level] || '#64748b'
          const gaugeData = [{ name: 'Risk', value: prob }, { name: 'Safe', value: 100 - prob }]

          return (
            <div key={name} className="risk-member">
              <div className="risk-gauge-container">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie data={gaugeData} cx="50%" cy="50%" innerRadius={42} outerRadius={56}
                         startAngle={90} endAngle={-270} paddingAngle={2} dataKey="value">
                      <Cell fill={color} />
                      <Cell fill="rgba(255,255,255,0.06)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="risk-gauge-center">
                  <span className="risk-gauge-value" style={{ color }}>{prob}%</span>
                </div>
              </div>
              <div className="risk-member-info">
                <h4 className="risk-member-name">{name}</h4>
                <span className={`badge badge-${color === '#22c55e' ? 'green' : color === '#f59e0b' ? 'orange' : 'red'}`}>
                  {dr.risk_level || 'N/A'}
                </span>
                <p className="risk-recommendation">{dr.recommendation}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
