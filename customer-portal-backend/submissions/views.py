from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.core.mail import EmailMessage
from django.conf import settings
from .models import GateEntrySubmission, AuditLog
from .serializers import GateEntrySubmissionSerializer, SubmissionCreateSerializer
from .qr_generator import generate_qr_code
from vehicles.models import VehicleDetails
from drivers.models import DriverHelper
from documents.models import CustomerDocument

class GateEntrySubmissionViewSet(viewsets.ModelViewSet):
    queryset = GateEntrySubmission.objects.all()
    serializer_class = GateEntrySubmissionSerializer
    parser_classes = (MultiPartParser, FormParser)

    @action(detail=False, methods=['post'], url_path='create')
    def create_submission(self, request):
        """
        Create gate entry submission with QR code generation
        
        POST /api/submissions/create/
        
        Form Data:
        - customer_email: string
        - customer_phone: string
        - vehicle_number: string
        - driver_name: string
        - driver_phone: string
        - driver_language: string
        - helper_name: string
        - helper_phone: string
        - helper_language: string
        - purchase_order: file
        - vehicle_registration: file
        - vehicle_insurance: file
        - puc: file
        - driver_license: file
        - transportation_approval: file
        - payment_approval: file
        - vendor_approval: file
        
        Response:
        {
            "submission": {
                "id": 1,
                "qrCodeImage": "http://...",
                "vehicleNumber": "MH12AB1234",
                ...
            }
        }
        """
        serializer = SubmissionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                # Extract data
                customer_email = serializer.validated_data['customer_email']
                customer_phone = serializer.validated_data['customer_phone']
                vehicle_number = serializer.validated_data['vehicle_number']
                driver_name = serializer.validated_data['driver_name']
                driver_phone = serializer.validated_data['driver_phone']
                driver_language = serializer.validated_data.get('driver_language', 'en')
                helper_name = serializer.validated_data.get('helper_name')
                helper_phone = serializer.validated_data.get('helper_phone')
                helper_language = serializer.validated_data.get('helper_language', 'en')

                # 1. Get or create vehicle
                vehicle, _ = VehicleDetails.objects.get_or_create(
                    vehicle_registration_no=vehicle_number.upper()
                )

                # 2. Validate or create driver
                driver, driver_created = DriverHelper.validate_or_create(
                    name=driver_name,
                    phone_no=driver_phone,
                    driver_type='Driver',
                    language=driver_language
                )

                # 3. Validate or create helper (if provided)
                helper = None
                if helper_name and helper_phone:
                    helper, helper_created = DriverHelper.validate_or_create(
                        name=helper_name,
                        phone_no=helper_phone,
                        driver_type='Helper',
                        language=helper_language
                    )

                # 4. Create submission (without QR yet)
                submission = GateEntrySubmission.objects.create(
                    customer_email=customer_email,
                    customer_phone=customer_phone,
                    vehicle=vehicle,
                    driver=driver,
                    helper=helper
                )

                # 5. Generate QR payload hash
                submission.qr_payload_hash = submission.generate_payload_hash()

                # 6. Generate QR code
                qr_payload = {
                    'submission_id': submission.id,
                    'customer_name': customer_email.split('@')[0],
                    'customer_email': customer_email,
                    'driver_name': driver.name,
                    'driver_phone': driver.phone_no,
                    'helper_name': helper.name if helper else '',
                    'helper_phone': helper.phone_no if helper else '',
                    'vehicle_number': vehicle.vehicle_registration_no,
                    'timestamp': submission.created_at.isoformat(),
                }
                
                qr_file = generate_qr_code(qr_payload)
                submission.qr_code_image = qr_file
                submission.save()

                # 7. Handle document uploads
                document_fields = [
                    'purchase_order', 'vehicle_registration', 'vehicle_insurance',
                    'puc', 'driver_license', 'transportation_approval',
                    'payment_approval', 'vendor_approval'
                ]

                for field in document_fields:
                    file = request.FILES.get(field)
                    if file:
                        CustomerDocument.replace_document(
                            customer_email=customer_email,
                            document_type=field,
                            new_file=file,
                            vehicle=vehicle,
                            driver=driver
                        )

                # 8. Create audit log
                AuditLog.objects.create(
                    submission=submission,
                    action='SUBMISSION_CREATED',
                    description=f'Gate entry submission created for vehicle {vehicle.vehicle_registration_no}',
                    user_email=customer_email,
                    ip_address=self.get_client_ip(request)
                )

                # 9. Send email notification
                self.send_qr_email(submission)

                # 10. Send SMS notification (placeholder)
                self.send_qr_sms(submission)

                # Return response
                return Response({
                    "submission": {
                        "id": submission.id,
                        "qrCodeImage": request.build_absolute_uri(submission.qr_code_image.url),
                        "vehicleNumber": submission.vehicle.vehicle_registration_no,
                        "driverPhone": submission.driver.phone_no,
                        "status": submission.status,
                        "createdAt": submission.created_at
                    }
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def send_qr_email(self, submission):
        """
        Send QR code via email
        """
        try:
            subject = f"Gate Entry QR Code - {submission.vehicle.vehicle_registration_no}"
            body = f"""
Dear Customer,

Your gate entry QR code has been generated successfully.

Vehicle Number: {submission.vehicle.vehicle_registration_no}
Driver: {submission.driver.name} ({submission.driver.phone_no})
{'Helper: ' + submission.helper.name + ' (' + submission.helper.phone_no + ')' if submission.helper else ''}

Please present this QR code at the gate entrance.

Best regards,
Gate Entry System
            """

            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.EMAIL_HOST_USER,
                to=[submission.customer_email],
            )

            # Attach QR code
            if submission.qr_code_image:
                email.attach_file(submission.qr_code_image.path)

            email.send(fail_silently=False)

            # Log email sent
            AuditLog.objects.create(
                submission=submission,
                action='EMAIL_SENT',
                description=f'QR code email sent to {submission.customer_email}',
                user_email=submission.customer_email
            )

        except Exception as e:
            # Log error but don't fail the submission
            AuditLog.objects.create(
                submission=submission,
                action='EMAIL_FAILED',
                description=f'Failed to send email: {str(e)}',
                user_email=submission.customer_email
            )

    def send_qr_sms(self, submission):
        """
        Send QR code link via SMS (placeholder implementation)
        """
        try:
            # Placeholder for SMS integration
            # In production, integrate with SMS provider (Twilio, AWS SNS, etc.)
            
            message = f"Gate Entry QR Code generated for vehicle {submission.vehicle.vehicle_registration_no}. " \
                      f"Check your email for details."
            
            # TODO: Implement actual SMS sending
            # sms_service.send(to=submission.customer_phone, message=message)

            # Log SMS attempt
            AuditLog.objects.create(
                submission=submission,
                action='SMS_QUEUED',
                description=f'SMS queued for {submission.customer_phone}',
                user_email=submission.customer_email
            )

        except Exception as e:
            # Log error
            AuditLog.objects.create(
                submission=submission,
                action='SMS_FAILED',
                description=f'Failed to send SMS: {str(e)}',
                user_email=submission.customer_email
            )

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