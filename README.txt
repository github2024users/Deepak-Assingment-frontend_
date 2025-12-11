
# Frontend (React) - React Scraper Portal

## Setup

1. Create a Google OAuth 2.0 Client ID:
   - Go to Google Cloud Console -> Credentials -> Create OAuth Client ID (Web application).
   - Add authorized JavaScript origins, e.g., http://localhost:3000
   - Copy the Client ID.

2. Create a .env file in the frontend folder with:
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   REACT_APP_API_URL=http://localhost:5000

3. Install and run:
   npm install
   npm start

The app uses @react-oauth/google for client-side authentication.








