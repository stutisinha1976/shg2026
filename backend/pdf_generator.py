"""
pdf_generator.py — Generate PDF report from APEX analysis results.
"""
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT


def generate_pdf(results: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("CustomTitle", parent=styles["Title"],
                                 fontSize=22, textColor=colors.HexColor("#1e3a5f"),
                                 spaceAfter=8, alignment=TA_CENTER)
    heading_style = ParagraphStyle("CustomH", parent=styles["Heading1"],
                                   fontSize=15, textColor=colors.HexColor("#4f46e5"),
                                   spaceBefore=16, spaceAfter=8)
    subhead_style = ParagraphStyle("CustomSH", parent=styles["Heading2"],
                                   fontSize=12, textColor=colors.HexColor("#6366f1"),
                                   spaceBefore=10, spaceAfter=6)
    body = ParagraphStyle("Body", parent=styles["Normal"],
                          fontSize=10, textColor=colors.HexColor("#333"),
                          spaceAfter=5, leading=14)

    elements = []

    # Title
    elements.append(Spacer(1, 1.5*inch))
    elements.append(Paragraph("SHG APEX v3.1 — Analysis Report", title_style))
    elements.append(HRFlowable(width="60%", thickness=2,
                               color=colors.HexColor("#4f46e5"),
                               spaceAfter=10, spaceBefore=10))
    elements.append(Paragraph("AI-Powered Microfinance Intelligence Platform",
                              ParagraphStyle("Sub", parent=body, fontSize=12,
                                             textColor=colors.HexColor("#6b7280"),
                                             alignment=TA_CENTER)))
    elements.append(Spacer(1, 0.3*inch))

    # Summary table
    summary_data = [
        ["Metric", "Value"],
        ["Total Members", str(results.get("total_members", 0))],
        ["Total Transactions", str(results.get("total_transactions", 0))],
        ["Total Amount", f"Rs.{results.get('total_amount_processed', 0):,.0f}"],
        ["Avg SHG Score", f"{results.get('avg_shg_score', 0):.1f} / 100"],
        ["Avg Credit Score", f"{results.get('avg_credit_score', 0):.0f} / 900"],
        ["Language Detected", results.get("detected_language", "N/A").title()],
        ["OCR Source", results.get("ocr_source", "N/A")],
        ["Fraud Risk", results.get("fraud_analysis", {}).get("risk_level", "N/A")],
    ]
    t = Table(summary_data, colWidths=[3.5*inch, 3.5*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c7d2fe")),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 1), (0, -1), colors.HexColor("#f0f0ff")),
    ]))
    elements.append(t)
    elements.append(PageBreak())

    member_analysis = results.get("member_analysis", {})

    # Fraud Detection
    elements.append(Paragraph("1. Fraud Detection Analysis", heading_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb"), spaceAfter=8))
    fraud = results.get("fraud_analysis", {})
    rl = fraud.get("risk_level", "N/A")
    rs = fraud.get("risk_score", 0)
    sc = "#22c55e" if rl == "Low" else "#f59e0b" if rl == "Medium" else "#ef4444"
    elements.append(Paragraph(f'<font color="{sc}"><b>Risk Level: {rl} ({rs}/100)</b></font>', body))
    for alert in fraud.get("alerts", []):
        elements.append(Paragraph(f"  • [{alert['severity']}] {alert['message']}", body))
    if not fraud.get("alerts"):
        elements.append(Paragraph("✓ No suspicious patterns detected.", body))
    elements.append(Spacer(1, 0.2*inch))

    # Credit Forecast
    elements.append(Paragraph("2. Credit Score Forecast", heading_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb"), spaceAfter=8))
    credit_data = [["Member", "Current", "3m", "6m", "12m", "Monthly Δ"]]
    for name, data in member_analysis.items():
        ct = data.get("credit_trajectory", {})
        tr = ct.get("trajectory", {})
        credit_data.append([
            name[:18], str(ct.get("current_score", "")),
            str(tr.get("3m", "")), str(tr.get("6m", "")), str(tr.get("12m", "")),
            f"+{ct.get('monthly_change', 0)}" if ct.get("monthly_change", 0) >= 0
            else str(ct.get("monthly_change", 0))
        ])
    ct = Table(credit_data, colWidths=[3*inch, 1.1*inch, 1.1*inch, 1.1*inch, 1.1*inch, 1.1*inch])
    ct.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c7d2fe")),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]))
    elements.append(ct)
    elements.append(Spacer(1, 0.2*inch))

    # Loan Default Risk
    elements.append(Paragraph("3. Loan Default Risk", heading_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb"), spaceAfter=8))
    risk_data = [["Member", "Risk Level", "Default %", "Recommendation"]]
    for name, data in member_analysis.items():
        dr = data.get("default_risk", {})
        risk_data.append([
            name[:18], dr.get("risk_level", "N/A"),
            f"{dr.get('default_probability', 0)}%",
            dr.get("recommendation", "N/A")[:40],
        ])
    rt = Table(risk_data, colWidths=[2.5*inch, 1.5*inch, 1.2*inch, 3.3*inch])
    rt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dc2626")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fecaca")),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]))
    elements.append(rt)
    elements.append(Spacer(1, 0.2*inch))

    # Optimal Loan
    elements.append(Paragraph("4. Optimal Loan Calculator", heading_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb"), spaceAfter=8))
    loan_data = [["Member", "Optimal Loan", "EMI 12m", "EMI 24m", "Tenure"]]
    for name, data in member_analysis.items():
        ol = data.get("optimal_loan", {})
        loan_data.append([
            name[:18],
            f"Rs.{ol.get('optimal_loan_amount', 0):,.0f}",
            f"Rs.{ol.get('emi_12_months', 0):,.0f}/mo",
            f"Rs.{ol.get('emi_24_months', 0):,.0f}/mo",
            ol.get("recommended_tenure", ""),
        ])
    lt = Table(loan_data, colWidths=[2.5*inch, 2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    lt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#059669")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#a7f3d0")),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]))
    elements.append(lt)
    elements.append(PageBreak())

    # XAI Explanations
    elements.append(Paragraph("5. AI Explanations (XAI)", heading_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb"), spaceAfter=8))
    for name, data in member_analysis.items():
        xai = data.get("xai_report", {})
        elements.append(Paragraph(f"<b>{name}</b>", subhead_style))
        elements.append(Paragraph(xai.get("plain_english_reason", ""), body))
        for tip in xai.get("improvement_roadmap", []):
            elements.append(Paragraph(f"  → {tip}", body))
        elements.append(Spacer(1, 0.1*inch))

    # Government Schemes
    gov_schemes = results.get("government_schemes", {})
    if gov_schemes:
        elements.append(PageBreak())
        elements.append(Paragraph("6. Government Scheme Eligibility", heading_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb"), spaceAfter=8))
        for member, schemes in gov_schemes.items():
            elements.append(Paragraph(f"<b>{member}</b> — {len(schemes)} schemes eligible", subhead_style))
            for s in schemes:
                elements.append(Paragraph(
                    f"  ✓ {s['scheme_name']} (Max: {s['max_amount']}, Rate: {s['rate']})", body))
                elements.append(Paragraph(f"    {s['description']}", body))
            elements.append(Spacer(1, 0.1*inch))

    # Footer
    elements.append(Spacer(1, 0.3*inch))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#4f46e5"), spaceAfter=8))
    elements.append(Paragraph("Generated by SHG APEX v3.1 • Powered by Gemini AI + Groq Fallback",
                              ParagraphStyle("Foot", parent=body, fontSize=8,
                                             textColor=colors.HexColor("#9ca3af"),
                                             alignment=TA_CENTER)))

    doc.build(elements)
    buffer.seek(0)
    return buffer
