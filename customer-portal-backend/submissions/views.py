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
        # Parse request data - works with both JSON and FormData
        serializer = SubmissionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                # Extract data from validated serializer
                customer_email = serializer.validated_data['customer_email']
                customer_phone = serializer.validated_data['customer_phone']
                vehicle_number = serializer.validated_data['vehicle_number']
                driver_name = serializer.validated_data['driver_name']
                driver_phone = serializer.validated_data['driver_phone']
                driver_language = serializer.validated_data.get('driver_language', 'en')
                helper_name = serializer.validated_data.get('helper_name')
                helper_phone = serializer.validated_data.get('helper_phone')
                helper_language = serializer.validated_data.get('helper_language', 'en')
                po_number = serializer.validated_data['poNumber']  # Required field

                # 1. Get or create vehicle
                vehicle, _ = VehicleDetails.objects.get_or_create(
                    vehicleRegistrationNo=vehicle_number.upper()
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

                # 4. Get or create PO
                po, _ = PODetails.objects.get_or_create(
                    id=po_number.strip().upper(),
                    defaults={'customerUserId': request.user}
                )

                # 5. Create DriverVehicleTagging
                driver_vehicle_tagging = DriverVehicleTagging.objects.create(
                    driverId=driver,
                    helperId=helper,
                    vehicleId=vehicle,
                    isVerified=False
                )

                # 6. Create PODriverVehicleTagging
                po_driver_vehicle_tagging = PODriverVehicleTagging.objects.create(
                    poId=po,
                    driverVehicleTaggingId=driver_vehicle_tagging,
                    rftagId=None,
                    actReportingTime=None,
                    exitTime=None
                )

                # 7. Create submission (without QR yet)
                submission = GateEntrySubmission.objects.create(
                    customer_email=customer_email,
                    customer_phone=customer_phone,
                    vehicle=vehicle,
                    driver=driver,
                    helper=helper
                )

                # 8. Generate QR payload hash
                qr_payload_data = {
                    'po_driver_vehicle_tagging_id': po_driver_vehicle_tagging.id
                }
                submission.qr_payload_hash = hashlib.sha256(
                    json.dumps(qr_payload_data, sort_keys=True).encode()
                ).hexdigest()

                # 9. Generate QR code with only PODriverVehicleTagging ID
                qr_payload = {
                    'id': po_driver_vehicle_tagging.id
                }
                
                qr_file = generate_qr_code(qr_payload)
                submission.qr_code_image = qr_file
                submission.save()

                # 10. Documents are already in DocumentControl table
                # Link documents to this submission if needed
                # (Optional: You can create relationships here if required)

                # 11. Create audit log
                AuditLog.objects.create(
                    submission=submission,
                    action='SUBMISSION_CREATED',
                    description=f'Gate entry submission created for vehicle {vehicle.vehicleRegistrationNo}',
                    user_email=customer_email,
                    ip_address=self.get_client_ip(request)
                )

                # 12. Send email notification
                self.send_qr_email(submission)

                # 13. Send SMS notification (placeholder)
                self.send_qr_sms(submission)

                # Return response
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

    def send_qr_email(self, submission):
        """
        Send QR code via email
        """
        try:
            subject = f"Gate Entry QR Code - {submission.vehicle.vehicleRegistrationNo}"
            body = f"""
Dear Customer,

Your gate entry QR code has been generated successfully.

Vehicle Number: {submission.vehicle.vehicleRegistrationNo}
Driver: {submission.driver.name} ({submission.driver.phoneNo})
{'Helper: ' + submission.helper.name + ' (' + submission.helper.phoneNo + ')' if submission.helper else ''}

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
            
            message = f"Gate Entry QR Code generated for vehicle {submission.vehicle.vehicleRegistrationNo}. " \
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