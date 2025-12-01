# Customer Gate Entry Portal

A React-based web portal for managing secure vehicle gate entry submissions. This application allows customers to submit driver details, helper information, and required documents to generate secure QR codes for facility gate access.

## Features

- **Multi-Step Form**: Three-step process for vehicle, driver, and document information
- **Secure Authentication**: Token-based authentication for access control
- **Document Management**: Upload multiple document types including POs, vehicle registration, insurance, PUC, driver licenses, and more
- **QR Code Generation**: Automatic generation of secure entry QR codes
- **Multi-Language Support**: Support for English, Hindi, Marathi, Gujarati, and Tamil
- **File Validation**: Supports PDF, JPG, JPEG, and PNG files up to 5MB
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Form Validation**: Comprehensive client-side validation for all form inputs
- **Persistent Authentication**: Token storage for convenient access

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build the application for production:
```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Usage

1. **Set Access Token**: Click "Set Access Token" and enter your customer access token
2. **Step 1 - Vehicle Information**: Enter customer email, phone, and vehicle number
3. **Step 2 - Driver Information**: Provide driver/helper names, phone numbers, and language preferences
4. **Step 3 - Document Uploads**: Upload required verification documents
5. **Generate QR Code**: Submit the form to generate a secure entry QR code

### Supported Document Types

- Purchase Order (PO)
- Vehicle Registration
- Vehicle Insurance
- PUC (Pollution Under Control)
- Driver License
- Transportation Approval
- Payment Approval
- Vendor Approval

### Form Validation Rules

- **Email**: Valid email format required
- **Phone Numbers**: Must follow +91XXXXXXXXXX format (10 digits)
- **Vehicle Number**: 2-50 characters, uppercase letters, numbers, spaces, or hyphens
- **Names**: Minimum 2 characters required
- **Documents**: PDF, JPG, JPEG, or PNG files up to 5MB

## Available Scripts

### `npm start`
Runs the app in development mode. The page will reload when you make changes.

### `npm test`
Launches the test runner in interactive watch mode. Refer to [CRA testing docs](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`
Builds the app for production to the `build` folder. The build is minified and optimized for best performance.

### `npm run eject`
**Note: this is a one-way operation. Once you eject, you can't go back!**

This command removes the single build dependency and gives you full control over configuration files.

## Technology Stack

- **Framework**: React 19.2.0
- **Styling**: Tailwind CSS 3.4.14
- **Icons**: Lucide React 0.471.0
- **Build Tool**: Create React App with react-scripts 5.0.1
- **Testing**: Jest, React Testing Library

## Project Structure

```
src/
├── components/
│   └── CustomerPortal.jsx    # Main application component
├── App.js                      # App entry point
├── App.css                     # App styles
├── index.js                    # React DOM render
├── index.css                   # Global styles
└── setupTests.js               # Test configuration
```

## API Integration

The application expects the following API endpoint:

- **POST** `/api/submissions/create`
  - Headers: `Authorization: Bearer <token>`
  - Body: FormData containing vehicle information, driver details, and document files
  - Response: JSON with submission data and QR code image URL

## Authentication

All submissions require a valid access token. The token is:
- Set through the "Customer Access Token" section
- Stored in browser's localStorage for persistence
- Sent as Bearer token in the Authorization header

## File Upload

Supports drag-and-drop and manual file selection. Maximum file size is 5MB per document.

Accepted formats:
- PDF (`application/pdf`)
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- JPG (`image/jpg`)

## Browser Support

The application supports modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

### "Authorization required" message
Set your customer access token using the "Set Access Token" button at the top of the form.

### File upload fails
Ensure the file is in one of the accepted formats (PDF, JPG, JPEG, PNG) and is under 5MB in size.

### Form validation errors
Check that all required fields are filled correctly:
- Email must be in valid format
- Phone numbers must follow +91XXXXXXXXXX format
- Vehicle number must be uppercase letters, numbers, spaces, or hyphens only

## Learn More

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

This project is part of a customer portal system for secure gate entry management.
