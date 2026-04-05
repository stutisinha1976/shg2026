import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './LoanCalculator.css'

const COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#f59e0b', '#22c55e', '#ec4899']

export default function LoanCalculator({ memberAnalysis }) {
  if (!memberAnalysis || Object.keys(memberAnalysis).length === 0) return null
  const members = Object.entries(memberAnalysis)

  const chartData = members.map(([name, data]) => {
    const ol = data.optimal_loan || {}
    return {
      name: name.length > 12 ? name.slice(0, 12) + '…' : name,
      fullName: name,
      loan: ol.optimal_loan_amount || 0,
      emi12: ol.emi_12_months || 0,
      emi24: ol.emi_24_months || 0,
      tenure: ol.recommended_tenure || '',
    }
  })

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null
    const d = payload[0].payload
    return (
      <div className="loan-tooltip">
        <p className="loan-tooltip-name">{d.fullName}</p>
        <p className="loan-tooltip-row"><span>Optimal Loan</span><strong>₹{d.loan.toLocaleString()}</strong></p>
        <p className="loan-tooltip-row"><span>EMI (12m)</span><strong>₹{d.emi12.toLocaleString()}/mo</strong></p>
        <p className="loan-tooltip-row"><span>EMI (24m)</span><strong>₹{d.emi24.toLocaleString()}/mo</strong></p>
        <p className="loan-tooltip-row"><span>Recommended</span><strong>{d.tenure}</strong></p>
      </div>
    )
  }

  return (
    <div className="loan-card glass-card">
      <h3 className="section-title"><span className="icon">💰</span>Optimal Loan Calculator</h3>
      <div className="loan-chart-container">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false}
                   axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false}
                   tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="loan" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="loan-details">
        {members.map(([name, data], i) => {
          const ol = data.optimal_loan || {}
          const le = data.loan_eligibility || {}
          return (
            <div key={name} className="loan-detail-card">
              <div className="loan-detail-header">
                <span className="loan-detail-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="loan-detail-name">{name}</span>
                <span className={`badge badge-${le.eligibility_category === 'High' ? 'green' :
                  le.eligibility_category === 'Good' ? 'green' : le.eligibility_category === 'Medium' ? 'orange' : 'red'}`}>
                  {le.eligibility_category}
                </span>
              </div>
              <div className="loan-detail-grid">
                <div><span className="loan-detail-label">Optimal Loan</span>
                  <span className="loan-detail-value">₹{(ol.optimal_loan_amount || 0).toLocaleString()}</span></div>
                <div><span className="loan-detail-label">EMI (12m)</span>
                  <span className="loan-detail-value">₹{(ol.emi_12_months || 0).toLocaleString()}</span></div>
                <div><span className="loan-detail-label">EMI (24m)</span>
                  <span className="loan-detail-value">₹{(ol.emi_24_months || 0).toLocaleString()}</span></div>
                <div><span className="loan-detail-label">Interest Rate</span>
                  <span className="loan-detail-value">{le.estimated_interest_rate}%</span></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
