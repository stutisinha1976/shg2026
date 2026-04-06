import { Download, BarChart2 } from 'lucide-react'
import GroupSummary from './GroupSummary'
import FraudDetection from './FraudDetection'
import CreditForecast from './CreditForecast'
import LoanDefaultRisk from './LoanDefaultRisk'
import LoanCalculator from './LoanCalculator'
import MemberDetails from './MemberDetails'
import GovernmentSchemes from './GovernmentSchemes'
import { useTranslation } from '../contexts/TranslationContext'
import './ResultsDashboard.css'

const API_BASE = 'http://localhost:5000/api'

export default function ResultsDashboard({ results }) {
  const { t } = useTranslation();
  if (!results) return null

  const memberAnalysis = results.member_analysis || {}

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`${API_BASE}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'SHG_APEX_Report.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to generate PDF: ' + err.message)
    }
  }

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          <span className="icon"><BarChart2 size={18} className='inline-block mr-1' /></span>
          {t("SHG APEX v3.1 Analysis Results")}
        </h2>
        <button className="pdf-btn" onClick={handleDownloadPDF}>
          <span><Download size={18} className='inline-block mr-1' /></span> {t("Download PDF Report")}
        </button>
      </div>

      <GroupSummary results={results} />

      <div className="dashboard-grid">
        <div className="dashboard-section full-width">
          <FraudDetection data={results.fraud_analysis} />
        </div>

        <div className="dashboard-section full-width">
          <MemberDetails memberAnalysis={memberAnalysis} />
        </div>

        <div className="dashboard-section full-width">
          <CreditForecast memberAnalysis={memberAnalysis} />
        </div>

        <div className="dashboard-section full-width">
          <LoanDefaultRisk memberAnalysis={memberAnalysis} />
        </div>

        <div className="dashboard-section full-width">
          <LoanCalculator memberAnalysis={memberAnalysis} />
        </div>

        <div className="dashboard-section full-width">
          <GovernmentSchemes schemes={results.government_schemes} />
        </div>
      </div>
    </div>
  )
}
