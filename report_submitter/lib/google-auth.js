import { google } from 'googleapis';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

export function getGoogleAuth(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

export function getDriveClient(auth) {
  return google.drive({ version: 'v3', auth });
}

export function getSheetsClient(auth) {
  return google.sheets({ version: 'v4', auth });
}