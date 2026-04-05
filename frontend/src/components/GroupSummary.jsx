import { Search, BarChart2, IndianRupee, Users, ClipboardList, Star, ShieldAlert, Globe } from 'lucide-react'
import './GroupSummary.css'

export default function GroupSummary({ results }) {
  if (!results) return null

  const stats = [
    { label: 'Members', value: results.total_members || 0, icon: <Users size={18} className="inline-block" />, color: 'var(--accent-secondary)' },
    { label: 'Transactions', value: results.total_transactions || 0, icon: <ClipboardList size={18} className="inline-block" />, color: 'var(--cyan)' },
    { label: 'Total Amount', value: `₹${(results.total_amount_processed || 0).toLocaleString()}`, icon: <IndianRupee size={18} className="inline-block" />, color: 'var(--green)' },
    { label: 'Avg SHG Score', value: `${results.avg_shg_score || 0}/100`, icon: <Star size={18} className="inline-block" />, color: 'var(--orange)' },
    { label: 'Avg Credit', value: `${Math.round(results.avg_credit_score || 0)}/900`, icon: <BarChart2 size={18} className="inline-block" />, color: 'var(--purple)' },
    { label: 'Fraud Risk', value: results.fraud_analysis?.risk_level || 'N/A', icon: <ShieldAlert size={18} className="inline-block" />,
      color: results.fraud_analysis?.risk_level === 'Low' ? 'var(--green)' :
             results.fraud_analysis?.risk_level === 'Medium' ? 'var(--orange)' : 'var(--red)' },
  ]

  return (
    <div className="group-summary animate-fade-in-up">
      {stats.map((stat, i) => (
        <div className="summary-stat glass-card" key={i}>
          <div className="summary-stat-icon">{stat.icon}</div>
          <div className="summary-stat-value" style={{ color: stat.color }}>{stat.value}</div>
          <div className="summary-stat-label">{stat.label}</div>
        </div>
      ))}
      {results.detected_language && (
        <div className="summary-meta">
          <span className="meta-tag"><Globe size={18} className="inline-block mr-1" /> {results.detected_language}</span>
          <span className="meta-tag"><Search size={18} className="inline-block mr-1" /> {results.ocr_source}</span>
        </div>
      )}
    </div>
  )
}
