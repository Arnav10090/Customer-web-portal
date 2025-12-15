from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.core.mail import EmailMessage
from django.conf import settings
from django.core.exceptions import ValidationError
from .models import GateEntrySubmission, AuditLog
from .serializers import GateEntrySubmissionSerializer, SubmissionCreateSerializer
from .qr_generator import generate_qr_code
from vehicles.models import VehicleDetails
from drivers.models import DriverHelper
from documents.models import CustomerDocument
from po_details.models import PODetails
from podrivervehicletagging.models import DriverVehicleTagging, PODriverVehicleTagging
import hashlib
import json


class GateEntrySubmissionViewSet(viewsets.ModelViewSet):
    queryset = GateEntrySubmission.objects.all()
    serializer_class = GateEntrySubmissionSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    @action(detail=False, methods=['post'], url_path='create')
    def create_submission(self, request):
        """
        Create gate entry submission with QR code generation
        Documents should already be uploaded to DocumentControl table

        Accepts JSON data (not multipart/form-data with files)
        """
        serializer = SubmissionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                customer_email = serializer.validated_data['customer_email']
                customer_phone = serializer.validated_data['customer_phone']
                vehicle_number = serializer.validated_data['vehicle_number']
                driver_name = serializer.validated_data['driver_name']
                driver_phone = serializer.validated_data['driver_phone']
                driver_language = serializer.validated_data.get('driver_language', 'en')
                helper_name = serializer.validated_data.get('helper_name')
                helper_phone = serializer.validated_data.get('helper_phone')
                helper_language = serializer.validated_data.get('helper_language', 'en')
                po_number = serializer.validated_data['poNumber']

                vehicle, _ = VehicleDetails.objects.get_or_create(
                    vehicleRegistrationNo=vehicle_number.upper()
                )

                driver, driver_created = DriverHelper.validate_or_create(
                    name=driver_name,
                    phone_no=driver_phone,
                    driver_type='Driver',
                    language=driver_language
                )

                helper = None
                if helper_name and helper_phone:
                    helper, helper_created = DriverHelper.validate_or_create(
                        name=helper_name,
                        phone_no=helper_phone,
                        driver_type='Helper',
                        language=helper_language
                    )

                po, _ = PODetails.objects.get_or_create(
                    id=po_number.strip().upper(),
                    defaults={'customerUserId': request.user}
                )

                driver_vehicle_tagging = DriverVehicleTagging.objects.create(
                    driverId=driver,
                    helperId=helper,
                    vehicleId=vehicle,
                    isVerified=False
                )

                po_driver_vehicle_tagging = PODriverVehicleTagging.objects.create(
                    poId=po,
                    driverVehicleTaggingId=driver_vehicle_tagging,
                    rftagId=None,
                    actReportingTime=None,
                    exitTime=None
                )

                submission = GateEntrySubmission.objects.create(
                    customer_email=customer_email,
                    customer_phone=customer_phone,
                    vehicle=vehicle,
                    driver=driver,
                    helper=helper
                )

                qr_payload_data = {
                    'po_driver_vehicle_tagging_id': po_driver_vehicle_tagging.id
                }
                submission.qr_payload_hash = hashlib.sha256(
                    json.dumps(qr_payload_data, sort_keys=True).encode()
                ).hexdigest()

                qr_payload = {
                    'id': po_driver_vehicle_tagging.id
                }

                qr_file = generate_qr_code(qr_payload)
                submission.qr_code_image = qr_file
                submission.save()

                self.send_qr_email(submission)
                self.send_qr_sms(submission)

                return Response({
                    "submission": {
                        "id": submission.id,
                        "qrCodeImage": request.build_absolute_uri(submission.qr_code_image.url),
                        "vehicleNumber": submission.vehicle.vehicleRegistrationNo,
                        "driverPhone": submission.driver.phoneNo,
                        "status": submission.status,
                        "createdAt": submission.created_at
                    }
                }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({
                "error": str(e.message) if hasattr(e, 'message') else str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ---------------------------------------------------------
    # EMAIL
    # ---------------------------------------------------------
    def send_qr_email(self, submission):
        """
        Send QR code via email with enhanced template
        """
        try:
            subject = f"Gate Entry QR Code - {submission.vehicle.vehicleRegistrationNo}"
            
            # Create HTML email body
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }}
        .content {{
            background-color: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }}
        .qr-container {{
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
        }}
        .info-box {{
            background-color: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
        }}
        .footer {{
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚛 Gate Entry QR Code</h1>
        </div>
        <div class="content">
            <p>Dear Customer,</p>
            
            <p>Your gate entry QR code has been generated successfully!</p>
            
            <div class="info-box">
                <strong>Entry Details:</strong><br>
                Vehicle Number: <strong>{submission.vehicle.vehicleRegistrationNo}</strong><br>
                Driver: {submission.driver.name} ({submission.driver.phoneNo})<br>
                {f'Helper: {submission.helper.name} ({submission.helper.phoneNo})<br>' if submission.helper else ''}
                Generated: {submission.created_at.strftime('%B %d, %Y at %I:%M %p')}
            </div>
            
            <div class="qr-container">
                <p><strong>Your QR Code:</strong></p>
                <p style="color: #6b7280; font-size: 14px;">
                    (QR code image is attached to this email)
                </p>
            </div>
            
            <div class="info-box" style="background-color: #fef3c7; border-left-color: #f59e0b;">
                <strong>⚠️ Important Instructions:</strong>
                <ul style="margin: 10px 0;">
                    <li>Present this QR code at the gate entrance</li>
                    <li>Keep both digital and printed copies handy</li>
                    <li>The driver will receive a token number upon scanning</li>
                    <li>This QR code is valid for single entry</li>
                </ul>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>
            <strong>Gate Entry System</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
"""

            # Plain text fallback
            text_body = f"""
Dear Customer,

Your gate entry QR code has been generated successfully.

Entry Details:
- Vehicle Number: {submission.vehicle.vehicleRegistrationNo}
- Driver: {submission.driver.name} ({submission.driver.phoneNo})
{f'- Helper: {submission.helper.name} ({submission.helper.phoneNo})' if submission.helper else ''}
- Generated: {submission.created_at.strftime('%B %d, %Y at %I:%M %p')}

Important Instructions:
✓ Present this QR code at the gate entrance
✓ Keep both digital and printed copies handy
✓ The driver will receive a token number upon scanning
✓ This QR code is valid for single entry

Best regards,
Customer Web Portal
"""

            from django.core.mail import EmailMultiAlternatives
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.EMAIL_HOST_USER,
                to=[submission.customer_email],
            )
            
            # Attach HTML version
            email.attach_alternative(html_body, "text/html")

            # Attach QR code image
            if submission.qr_code_image:
                email.attach_file(submission.qr_code_image.path)

            email.send(fail_silently=False)

            # Log success (optional - currently commented out in your code)
            print(f"✅ Email sent successfully to {submission.customer_email}")

        except Exception as e:
            # Log error
            print(f"❌ Failed to send email: {str(e)}")
            import traceback
            traceback.print_exc()

    # ---------------------------------------------------------
    # SMS
    # ---------------------------------------------------------
    def send_qr_sms(self, submission):
        """
        Send QR code link via SMS (placeholder implementation)
        """
        try:
            message = (
                f"Gate Entry QR Code generated for vehicle "
                f"{submission.vehicle.vehicleRegistrationNo}."
            )
        except Exception:
            pass

    # ---------------------------------------------------------
    # CLIENT IP
    # ---------------------------------------------------------
    def get_client_ip(self, request):
        """
        Get client IP address from request
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip