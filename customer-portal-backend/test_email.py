import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'customer_portal.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    try:
        send_mail(
            subject='Test Email from Customer Web Portal',
            message='This is a test email to verify email configuration.',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=['test@example.com'],  # Replace with your test email
            fail_silently=False,
        )
        print("✅ Email sent successfully!")
        return True
    except Exception as e:
        print(f"❌ Email failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("Testing email configuration...")
    test_email()