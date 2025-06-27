# Report Submitter

A Next.js application that replaces the Python Excel processor with a web-based solution that works with Google Drive files.

## Features

- Google OAuth authentication
- Browse and select Excel files from Google Drive
- View Excel files with multiple sheet tabs
- Decode compressed homework data
- Update student attendance and homework data
- Real-time file updates in Google Sheets

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Drive API
   - Google Sheets API
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Save the Client ID and Client Secret

### 2. Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in the required values:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
   ```

3. Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

### 3. Installation

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to use the application.

## Usage

1. Sign in with your Google account
2. Browse your Google Drive for Excel files
3. Select a file to open it
4. Paste encoded homework data in the text area
5. Click "Update File" to process and update the Google Sheet

## Data Format

The application expects encoded data in the following format:
```
فصل: [Class Name]
التاريخ: [Date]
---
[Compressed Base64 Data]
```

The compressed data should contain:
- Student attendance information
- Previous homework grades
- New homework assignments

## Security Notes

- API keys and secrets are stored in environment variables
- Authentication is handled by NextAuth.js
- Only users with proper Google Drive permissions can access and modify files
- All API routes are protected by authentication

## Production Deployment

1. Update environment variables for production
2. Add your production domain to Google OAuth redirect URIs
3. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)
4. Ensure HTTPS is enabled for secure authentication