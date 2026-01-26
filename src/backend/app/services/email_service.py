"""Email service for phishing simulation."""
import os
import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from jinja2 import Environment, FileSystemLoader
from pathlib import Path

# Email configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USER)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Template setup
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))


def generate_tracking_token() -> str:
    """Generate a unique tracking token for email clicks."""
    return secrets.token_urlsafe(32)


def render_phishing_email(
    template_name: str,
    recipient_name: str,
    tracking_token: str,
    **kwargs
) -> str:
    """Render a phishing email template with tracking links."""
    try:
        template = jinja_env.get_template(f"{template_name}.html")
    except:
        # Fallback to default template
        template = jinja_env.get_template("default.html")
    
    tracking_url = f"{BACKEND_URL}/api/v1/simulation/track/{tracking_token}"
    pixel_url = f"{BACKEND_URL}/api/v1/simulation/pixel/{tracking_token}.png"
    
    return template.render(
        recipient_name=recipient_name,
        tracking_url=tracking_url,
        pixel_url=pixel_url,
        **kwargs
    )


async def send_phishing_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_name: str = "보안팀"
) -> bool:
    """Send a phishing simulation email via SMTP."""
    if not SMTP_USER or not SMTP_PASSWORD:
        print("SMTP credentials not configured")
        return False
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{SENDER_EMAIL}>"
        msg["To"] = to_email
        
        # Plain text fallback
        text_part = MIMEText("이 이메일은 HTML을 지원하는 클라이언트에서 확인해주세요.", "plain", "utf-8")
        html_part = MIMEText(html_content, "html", "utf-8")
        
        msg.attach(text_part)
        msg.attach(html_part)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
        
    except Exception as e:
        print(f"Email send error: {e}")
        return False


# Predefined phishing scenarios
PHISHING_SCENARIOS = {
    "password_reset": {
        "subject": "[긴급] 비밀번호 변경이 필요합니다",
        "template": "password_reset",
        "from_name": "계정 보안팀"
    },
    "payment_receipt": {
        "subject": "결제 완료 - 영수증 확인",
        "template": "payment_receipt",
        "from_name": "결제 알림"
    },
    "delivery_notice": {
        "subject": "택배 배송 안내 - 주소 확인 필요",
        "template": "delivery_notice",
        "from_name": "배송 안내"
    }
}
