import qrcode
from io import BytesIO
from django.core.files import File
import json

def generate_qr_code(payload_data):
    """
    Generate QR code image from payload data
    
    Args:
        payload_data (dict): Dictionary containing QR payload
        
    Returns:
        File: Django File object containing QR code image
    """
    # Create JSON string from payload
    payload_json = json.dumps(payload_data, indent=2)
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(payload_json)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to BytesIO
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    # Convert to Django File
    filename = f"qr_{payload_data.get('vehicle_number', 'code')}.png"
    return File(buffer, name=filename)