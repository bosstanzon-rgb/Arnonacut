"""
Professional PDF kit: Jinja2 text templates + ReportLab with embedded Noto fonts
and logical→visual Hebrew shaping (python-bidi).

WeasyPrint is not used here so PDFs build without system Pango/GTK (better for
containers and minimal macOS installs).
"""

from __future__ import annotations

import io
import zipfile
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape

from bidi.algorithm import get_display
from jinja2 import Environment, FileSystemLoader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from .rules_loader import get_city_rules, load_municipal_rules

_PACKAGE_DIR = Path(__file__).resolve().parent.parent
_TPL_DIR = _PACKAGE_DIR / "templates" / "pdf_kit"
_FONT_DIR = _PACKAGE_DIR / "assets" / "fonts"

_fonts_registered = False


def _ensure_fonts() -> None:
    global _fonts_registered
    if _fonts_registered:
        return
    he_path = _FONT_DIR / "NotoSansHebrew-Regular.ttf"
    lat_path = _FONT_DIR / "NotoSans-Regular.ttf"
    if not he_path.is_file() or not lat_path.is_file():
        raise FileNotFoundError(
            f"Missing font files under {_FONT_DIR}. See assets/fonts/README.md"
        )
    pdfmetrics.registerFont(TTFont("NotoHebrew", str(he_path)))
    pdfmetrics.registerFont(TTFont("NotoSans", str(lat_path)))
    _fonts_registered = True


def _jinja_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(_TPL_DIR)),
        autoescape=False,
    )


def _is_mostly_latin_line(line: str) -> bool:
    letters = [c for c in line if c.isalpha()]
    if not letters:
        return True
    latin = sum(1 for c in letters if ord(c) < 128)
    return latin / len(letters) >= 0.75


def _paragraph_for_line(line: str, he_style: ParagraphStyle, en_style: ParagraphStyle) -> Paragraph:
    safe = escape(line.strip())
    if _is_mostly_latin_line(line):
        return Paragraph(safe.replace("\n", "<br/>"), en_style)
    # Hebrew / mixed: bidi visual reordering for ReportLab LTR canvas
    return Paragraph(get_display(safe).replace("\n", "<br/>"), he_style)


def _story_from_plain_template(template_name: str, ctx: dict) -> list:
    _ensure_fonts()
    styles = getSampleStyleSheet()
    he_style = ParagraphStyle(
        "he",
        parent=styles["Normal"],
        fontName="NotoHebrew",
        fontSize=11,
        leading=16,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#0f172a"),
    )
    en_style = ParagraphStyle(
        "en",
        parent=styles["Normal"],
        fontName="NotoSans",
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#334155"),
    )
    env = _jinja_env()
    text = env.get_template(template_name).render(**ctx)
    story: list = []
    for block in text.split("\n\n"):
        block = block.strip()
        if not block:
            continue
        for line in block.split("\n"):
            if not line.strip():
                story.append(Spacer(1, 0.12 * cm))
                continue
            story.append(_paragraph_for_line(line, he_style, en_style))
        story.append(Spacer(1, 0.28 * cm))
    return story


def _build_doc(story: list, title: str) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=title,
    )
    doc.build(story)
    out = buf.getvalue()
    buf.close()
    return out


def build_kit_context(*, order_id: str, session_id: str, profile: Optional[dict]) -> dict:
    profile = profile or {}
    year = int(profile.get("rules_year") or 2026)
    city_id = str(profile.get("city_id") or "").strip()
    city = get_city_rules(city_id, year) if city_id else None
    mun_he = city["names"]["he"] if city and city.get("names") else "________________"
    mun_en = city["names"]["en"] if city and city.get("names") else "________________"
    rules = load_municipal_rules(year)
    catalog = rules.get("special_status_catalog") or []
    codes = profile.get("special_statuses") or []
    if not isinstance(codes, list):
        codes = []
    labels: list[str] = []
    for code in codes:
        row = next((c for c in catalog if c.get("code") == code), None)
        if row:
            labels.append(str(row.get("label_he") or row.get("label_en") or code))
    statuses_he = " · ".join(labels) if labels else "לא צוין — יש לאמת מול הרשות"

    municipality_en_line = f"({mun_en})" if mun_en and mun_en != "________________" else ""

    now = datetime.utcnow()
    date_he = now.strftime("%d/%m/%Y") + " (UTC)"

    return {
        "municipality_he": mun_he,
        "municipality_en": mun_en,
        "municipality_en_line": municipality_en_line,
        "household_size": str(profile.get("household_size") or "—"),
        "income_nis": str(profile.get("gross_monthly_income_nis") if profile.get("gross_monthly_income_nis") not in (None, "") else "—"),
        "apartment_sqm": str(profile.get("apartment_sqm") if profile.get("apartment_sqm") not in (None, "") else "—"),
        "statuses_he": statuses_he,
        "session_id": session_id,
        "order_id": order_id,
        "tax_year": str(year),
        "date_he": date_he,
        "generated_utc": now.isoformat(timespec="seconds") + " UTC",
    }


def render_cover_letter_pdf(ctx: dict) -> bytes:
    story = _story_from_plain_template("cover_letter_he.j2", ctx)
    title_style = ParagraphStyle(
        "title",
        fontName="NotoHebrew",
        fontSize=16,
        leading=22,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#0c4a6e"),
        spaceAfter=14,
    )
    story.insert(0, Spacer(1, 0.2 * cm))
    story.insert(0, Paragraph(get_display(escape("טיוטת מכסה רשמית — לעריכה עצמית בלבד")), title_style))
    return _build_doc(story, "ArnonaCut-CoverLetter")


def render_submission_instructions_pdf(ctx: dict) -> bytes:
    story = _story_from_plain_template("submission_instructions_he.j2", ctx)
    return _build_doc(story, "ArnonaCut-SubmissionInstructions")


def render_application_draft_pdf(ctx: dict) -> bytes:
    story = _story_from_plain_template("application_draft_he.j2", ctx)
    title_style = ParagraphStyle(
        "title",
        fontName="NotoHebrew",
        fontSize=14,
        leading=20,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#0f766e"),
        spaceAfter=12,
    )
    story.insert(0, Spacer(1, 0.2 * cm))
    story.insert(
        0,
        Paragraph(
            get_display(escape("טופס בקשה / בירור ארנונה — טיוטה ממולאת (לא רשמי)")),
            title_style,
        ),
    )
    return _build_doc(story, "ArnonaCut-ApplicationDraft")


def render_personalized_checklist_pdf(ctx: dict) -> bytes:
    story = _story_from_plain_template("checklist_personal_he.j2", ctx)
    title_style = ParagraphStyle(
        "title",
        fontName="NotoHebrew",
        fontSize=14,
        leading=20,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#0369a1"),
        spaceAfter=12,
    )
    story.insert(0, Spacer(1, 0.2 * cm))
    story.insert(
        0,
        Paragraph(get_display(escape("רשימת בדיקה אישית — ArnonaCut")), title_style),
    )
    return _build_doc(story, "ArnonaCut-Checklist")


def build_professional_kit_zip(*, order_id: str, session_id: str, profile: Optional[dict]) -> bytes:
    ctx = build_kit_context(order_id=order_id, session_id=session_id, profile=profile)
    pdfs = {
        "01-arnona-discount-application-draft.pdf": render_application_draft_pdf(ctx),
        "02-cover-letter-hebrew-formal.pdf": render_cover_letter_pdf(ctx),
        "03-personalized-checklist-hebrew.pdf": render_personalized_checklist_pdf(ctx),
        "04-submission-instructions-hebrew.pdf": render_submission_instructions_pdf(ctx),
    }
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(
            "README.txt",
            "ArnonaCut — ערכת מסמכים\n"
            "========================\n\n"
            "קבצי PDF אלו נוצרו לצורכי הכנה בלבד. אינם טפסים רשמיים של עירייה.\n"
            "יש לאמת כל פרט, למלא טפסים רשמיים, ולהגיש לפי הנוהל הרשמי בלבד.\n"
            "ArnonaCut does not submit documents on your behalf.\n",
        )
        for name, content in pdfs.items():
            zf.writestr(name, content)
    out = buf.getvalue()
    buf.close()
    return out
