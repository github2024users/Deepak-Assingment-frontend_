import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';

/*
  Login component uses @react-oauth/google's useGoogleLogin hook to open the
  Google OAuth popup and returns the credential information to the parent.
  You need to create a Google OAuth Client ID and set it as REACT_APP_GOOGLE_CLIENT_ID
*/

/*
  Handles Google OAuth login.
  Retrieves the access_token → fetches user profile → sends to parent component.
*/
export default function Login({ onLogin }) {

  // Initialize Google login handler
  const login = useGoogleLogin({
    onSuccess: tokenResponse => {
      // tokenResponse contains the OAuth access token
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`
        }
      })
      .then(res => res.json())
      .then(userInfo => {
        // Pass user info to parent (App.js)
        onLogin({ ...userInfo, token: tokenResponse.access_token });
      })
      .catch(err => {
        console.error('Failed to fetch user info', err);
        alert('Login succeeded but failed to fetch user info. Check console.');
      });
    },

    // Error handler
    onError: errorResponse => {
      console.error('Login Failed:', errorResponse);
      alert('Login Failed');
    },

    // Scopes required
    scope: 'openid profile email'
  });

  return (
    <div className="login-card">
      <h2>Sign in to access the Scraper</h2>
      <p>Please sign in with your Google account</p>

      {/* Trigger login */}
      <div style={{marginTop:16}}>
        <button className="button" onClick={() => login()}>
          Sign in with Google
        </button>
      </div>

      <p style={{fontSize:12, marginTop:12}}>You can use the email and profile permission only.</p>
    </div>
  );
}
