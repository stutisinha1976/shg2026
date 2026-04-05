import { TrendingUp } from 'lucide-react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts'
import './CreditForecast.css'

const COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#f59e0b', '#22c55e', '#ec4899', '#f97316']

export default function CreditForecast({ memberAnalysis }) {
  if (!memberAnalysis || Object.keys(memberAnalysis).length === 0) return null

  const members = Object.entries(memberAnalysis)

  const chartData = ['Current', '3 Months', '6 Months', '12 Months'].map((period) => {
    const point = { period }
    members.forEach(([name, data]) => {
      const ct = data.credit_trajectory || {}
      const t = ct.trajectory || {}
      if (period === 'Current') point[name] = ct.current_score
      else if (period === '3 Months') point[name] = t['3m']
      else if (period === '6 Months') point[name] = t['6m']
      else if (period === '12 Months') point[name] = t['12m']
    })
    return point
  })

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null
    return (
      <div className="credit-tooltip">
        <p className="credit-tooltip-label">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="credit-tooltip-row">
            <span className="credit-tooltip-dot" style={{ background: entry.color }} />
            <span className="credit-tooltip-name">{entry.name}</span>
            <span className="credit-tooltip-value">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="credit-card glass-card">
      <h3 className="section-title"><span className="icon"><TrendingUp size={18} className='inline-block mr-1' /></span>12-Month Credit Forecast</h3>

      <div className="credit-chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {members.map(([name], i) => (
                <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={12} tickLine={false}
                   axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false}
                   domain={['dataMin - 20', 'dataMax + 20']} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="circle"
                    wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
            {members.map(([name], i) => (
              <Area key={name} type="monotone" dataKey={name}
                    stroke={COLORS[i % COLORS.length]} strokeWidth={2.5}
                    fill={`url(#grad-${i})`}
                    dot={{ r: 5, fill: COLORS[i % COLORS.length], strokeWidth: 2, stroke: 'var(--bg-primary)' }}
                    activeDot={{ r: 7, stroke: COLORS[i % COLORS.length], strokeWidth: 2 }} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="credit-table-container">
        <table className="credit-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Current</th>
              <th>3m</th>
              <th>6m</th>
              <th>12m</th>
              <th>Δ/Month</th>
              <th>Months to 750</th>
            </tr>
          </thead>
          <tbody>
            {members.map(([name, data], i) => {
              const ct = data.credit_trajectory || {}
              const t = ct.trajectory || {}
              const mc = ct.monthly_change || 0
              return (
                <tr key={name}>
                  <td><span className="credit-member-dot" style={{ background: COLORS[i % COLORS.length] }} />{name}</td>
                  <td>{ct.current_score}</td>
                  <td>{t['3m'] || '-'}</td>
                  <td>{t['6m'] || '-'}</td>
                  <td>{t['12m'] || '-'}</td>
                  <td className={mc >= 0 ? 'positive' : 'negative'}>{mc >= 0 ? `+${mc}` : mc}</td>
                  <td>{ct.months_to_750 != null ? `${ct.months_to_750}m` : '✓'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
