from abc import ABC, abstractmethod
import resend
import httpx
from app.core.config import settings

class NotificationService(ABC):
    @abstractmethod
    def send_email(self, to_email: str, subject: str, html_body: str) -> bool:
        pass
        
    @abstractmethod
    async def send_whatsapp(self, to_phone: str, text: str) -> bool:
        pass

class PlatformNotificationService(NotificationService):
    def __init__(self):
        resend.api_key = settings.RESEND_API_KEY

    def send_email(self, to_email: str, subject: str, html_body: str) -> bool:
        try:
            r = resend.Emails.send({
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": to_email,
                "subject": subject,
                "html": html_body
            })
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

    # async def send_whatsapp(self, to_phone: str, text: str) -> bool:
    #     if not settings.EVOLUTION_API_URL or not settings.EVOLUTION_API_KEY:
    #         return False
            
    #     url = f"{settings.EVOLUTION_API_URL}/message/sendText/{settings.EVOLUTION_INSTANCE_NAME}"
    #     headers = {
    #         "apikey": settings.EVOLUTION_API_KEY,
    #         "Content-Type": "application/json"
    #     }
    #     payload = {
    #         "number": to_phone,
    #         "options": {"delay": 1200, "presence": "composing"},
    #         "textMessage": {"text": text}
    #     }
        
    #     async with httpx.AsyncClient() as client:
    #         try:
    #             response = await client.post(url, json=payload, headers=headers)
    #             return response.status_code in (200, 201)
    #         except Exception as e:
    #             print(f"Error sending WhatsApp: {e}")
    #             return False