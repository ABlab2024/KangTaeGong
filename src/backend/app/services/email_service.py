"""
Email Service for KangTaeGong MVP.
Handles phishing simulation email delivery via Gmail SMTP.
Enhanced with tracking capabilities.
"""
import os
import smtplib
import ssl
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
from app.core.config import settings

# Template setup
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))


def generate_tracking_token() -> str:
    """Generate a unique tracking token for email clicks."""
    return secrets.token_urlsafe(32)


class EmailService:
    def __init__(self):
        self.server = settings.SMTP_SERVER
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAIL_FROM or settings.SMTP_USERNAME
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:8002")
    
    def _create_tracking_pixel(self, simulation_id: str) -> str:
        """이메일 열람 추적용 1x1 투명 픽셀 이미지 태그 생성"""
        tracking_url = f"{self.backend_url}/api/v1/track/open/{simulation_id}"
        return f'<img src="{tracking_url}" width="1" height="1" style="display:none;" alt="" />'
    
    def _wrap_link(self, original_url: str, simulation_id: str) -> str:
        """링크 클릭 추적을 위한 래핑"""
        from urllib.parse import quote
        tracking_url = f"{self.backend_url}/api/v1/track/click/{simulation_id}?redirect={quote(original_url)}"
        return tracking_url
    
    async def send_phishing_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        sender_name: str,
        simulation_id: str,
        dummy_page_url: Optional[str] = None
    ) -> bool:
        """피싱 시뮬레이션 이메일을 발송합니다."""
        if not self.username or not self.password:
            print("❌ SMTP credentials not configured")
            return False
        
        try:
            # 링크를 추적 링크로 변환
            if dummy_page_url:
                tracked_link = self._wrap_link(dummy_page_url, simulation_id)
                body_html = body_html.replace("{link}", tracked_link)
            
            # 트래킹 픽셀 추가
            tracking_pixel = self._create_tracking_pixel(simulation_id)
            body_html = body_html + tracking_pixel
            
            # 이메일 구성
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{sender_name} <{self.from_email}>"
            message["To"] = to_email
            
            # HTML 본문
            html_part = MIMEText(body_html, "html", "utf-8")
            message.attach(html_part)
            
            # SMTP 발송
            context = ssl.create_default_context()
            with smtplib.SMTP(self.server, self.port) as server:
                server.starttls(context=context)
                server.login(self.username, self.password)
                server.sendmail(self.from_email, to_email, message.as_string())
            
            print(f"✅ Email sent to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Email send error: {e}")
            return False
    
    async def send_training_notification(
        self,
        to_email: str,
        next_training_period: str
    ) -> bool:
        """훈련 예정 안내 이메일을 발송합니다."""
        subject = "[강태공] 피싱 방지 훈련 안내"
        body_html = f"""
        <html>
        <body style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; border-radius: 12px; padding: 30px;">
                <h1 style="color: #00f3ff;">🎣 피싱 방지 훈련 안내</h1>
                <p>안녕하세요!</p>
                <p>강태공(KangTaeGong) 피싱 방지 훈련 서비스입니다.</p>
                <p style="background: #2d2d44; padding: 15px; border-radius: 8px; border-left: 4px solid #00f3ff;">
                    <strong>다음 훈련 예정 기간:</strong> {next_training_period}
                </p>
                <p>
                    해당 기간 동안 실제 피싱과 유사한 훈련 이메일이 발송될 수 있습니다.
                    이는 100% 안전한 교육용 시뮬레이션이며, 실제 피해는 발생하지 않습니다.
                </p>
                <p style="color: #888; font-size: 12px; margin-top: 30px;">
                    ※ 본 메일은 발신 전용입니다. 문의사항은 대시보드를 이용해주세요.
                </p>
            </div>
        </body>
        </html>
        """
        
        if not self.username or not self.password:
            print("❌ SMTP credentials not configured")
            return False
        
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"강태공 보안팀 <{self.from_email}>"
            message["To"] = to_email
            
            html_part = MIMEText(body_html, "html", "utf-8")
            message.attach(html_part)
            
            context = ssl.create_default_context()
            with smtplib.SMTP(self.server, self.port) as server:
                server.starttls(context=context)
                server.login(self.username, self.password)
                server.sendmail(self.from_email, to_email, message.as_string())
            
            return True
        except Exception as e:
            print(f"❌ Notification email error: {e}")
            return False


# Singleton instance
email_service = EmailService()


# Legacy functions for backward compatibility
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
        template = jinja_env.get_template("default.html")
    
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8002")
    tracking_url = f"{backend_url}/api/v1/simulation/track/{tracking_token}"
    pixel_url = f"{backend_url}/api/v1/simulation/pixel/{tracking_token}.png"
    
    return template.render(
        recipient_name=recipient_name,
        tracking_url=tracking_url,
        pixel_url=pixel_url,
        **kwargs
    )


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
