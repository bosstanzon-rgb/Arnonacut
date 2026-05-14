import io
import zipfile
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

_TPL_DIR = Path(__file__).resolve().parent.parent / "templates" / "pdf"


def _jinja_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(_TPL_DIR)),
        autoescape=select_autoescape(enabled_extensions=()),
    )


def render_checklist_pdf(
    *,
    session_id: str,
    order_id: str,
    answers: dict[str, str],
    estimate: dict,
    generated_at: datetime,
) -> bytes:
    """Generate a simple, print-ready PDF (Latin text for maximum font compatibility)."""
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title",
        parent=styles["Heading1"],
        textColor=colors.HexColor("#0f766e"),
        spaceAfter=12,
    )
    body = ParagraphStyle("body", parent=styles["BodyText"], fontSize=10, leading=14)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="ArnonaCut Preparation Checklist",
    )
    story: list = []
    story.append(Paragraph("ArnonaCut — Preparation Checklist (Educational)", title_style))
    story.append(
        Paragraph(
            "<b>Important:</b> This document is generic information only. It is not legal advice, "
            "not tax advice, and not a prediction of government outcomes. You are responsible for "
            "your own filings and deadlines.",
            body,
        )
    )
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph(f"<b>Reference:</b> session {session_id} · order {order_id}", body))
    story.append(Paragraph(f"<b>Generated (UTC):</b> {generated_at.isoformat(timespec='seconds')}", body))
    story.append(Spacer(1, 0.6 * cm))

    env = _jinja_env()
    tpl = env.get_template("checklist_blocks.j2")
    blocks = tpl.render(answers=answers, estimate=estimate)
    for block in blocks.split("\n\n"):
        block = block.strip()
        if block:
            story.append(Paragraph(block.replace("\n", "<br/>"), body))
            story.append(Spacer(1, 0.25 * cm))

    story.append(Spacer(1, 0.5 * cm))
    data = [
        ["Step", "Action"],
        ["1", "Collect official arnona notices and payment history for the last 24 months."],
        ["2", "List property facts: address, size, use, ownership, and any exemptions you believe apply."],
        ["3", "Draft a short, factual timeline of changes (renovations, occupancy, errors)."],
        ["4", "Prepare comparables only from public sources you are allowed to use."],
        ["5", "Verify municipality contact channels and appeal windows independently."],
    ]
    t = Table(data, colWidths=[2 * cm, 13 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0ea5e9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(t)

    doc.build(story)
    pdf = buf.getvalue()
    buf.close()
    return pdf


def render_templates_zip(
    *,
    session_id: str,
    order_id: str,
    answers: dict[str, str],
    estimate: dict,
) -> bytes:
    env = _jinja_env()
    letter = env.get_template("letter_skeleton.j2").render(
        session_id=session_id,
        order_id=order_id,
        answers=answers,
        estimate=estimate,
    )
    memo = env.get_template("internal_memo.j2").render(
        session_id=session_id,
        order_id=order_id,
        answers=answers,
        estimate=estimate,
    )
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("README.txt", _readme_text())
        zf.writestr("letter_skeleton.txt", letter)
        zf.writestr("internal_facts_memo.txt", memo)
        zf.writestr("evidence_index_template.txt", _evidence_index())
    out = buf.getvalue()
    buf.close()
    return out


def _readme_text() -> str:
    return (
        "ArnonaCut — Template Pack\n"
        "========================\n\n"
        "These files are blank structures for your own edits.\n"
        "Do not submit anything automatically from this app.\n"
        "Verify all facts, dates, and legal requirements with official sources.\n"
    )


def _evidence_index() -> str:
    return (
        "Evidence index (template)\n"
        "-------------------------\n"
        "Item | Description | Source | Date obtained | Notes\n"
        "-----|-------------|--------|---------------|------\n"
        "1    |             |        |               |\n"
        "2    |             |        |               |\n"
    )
