# Frontend - Web Scraper Portal

React-based frontend for the Web Scraper Portal with Google OAuth authentication.

## 📋 Requirements

- **Node.js** 14+ 
- **npm** 6+
- **Modern browser** (Chrome, Firefox, Safari, Edge)
- **Google OAuth Client ID**

## 🔑 Google OAuth Setup

### Step 1: Create OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
4. Choose **Web application**
5. Add authorized origins:
   - `http://localhost:3000`
6. Add authorized redirect URIs:
   - `http://localhost:3000`
7. Copy the **Client ID**


### Step 2: Create .env File

Create `frontend/.env` file:

```
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
REACT_APP_API_URL=http://localhost:5000
```

NOTE: if .env file already exists then no need to create the file. Just paste your client id without any quotation

for example:
REACT_APP_GOOGLE_CLIENT_ID=1025812354080-sjvmd62okhe0qskmhs3dhe65gjk8jmvic.apps.googleusercontent.com (don't use it as client id, it's only for example, it doesn't exists)


Replace `your_client_id_here` with your actual Google Client ID.

## 🚀 Installation

```bash or terminal
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will open at: http://localhost:3000

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html              # HTML entry point
├── src/
│   ├── components/
│   │   ├── Login.js            # Google OAuth login component
│   │   └── Dashboard.js        # Main dashboard & scraping interface
│   ├── App.js                  # Main app component with routing
│   ├── App.css                 # Global styles
│   ├── index.js                # React DOM render
│   └── index.html              # HTML template
├── package.json                # Dependencies & scripts
├── .env                        # Environment variables
└── README.md                   # This file
```

## 🎯 Components

### App.js
Main component that handles:
- Google OAuth provider setup
- User authentication state
- Routing between Login and Dashboard
- Session persistence

```javascript
<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
  {!user ? <Login /> : <Dashboard user={user} />}
</GoogleOAuthProvider>
```

### Login.js
- Google OAuth login button
- Handles authentication flow
- Fetches user profile information
- Stores user data

### Dashboard.js
- Main scraping interface
- URL input and button controls
- Data display with categorization
- Refresh and Clear All functionality
- Error/success notifications

## 🎨 Styling

### Colors Used
- **Primary Blue:** `#0d6efd`
- **Success Green:** `#28a745`
- **Warning Yellow:** `#ffc107`
- **Danger Red:** `#ff0000`
- **Gray:** `#6c757d`

### Category Colors
- AI: `#0066FF` (Blue)
- Tech: `#FF6600` (Orange)
- Startups: `#FF1493` (Pink)
- Tutorials: `#00AA00` (Green)
- Open Source: `#9900FF` (Purple)
- Programming: `#FF9900` (Orange)
- Web: `#00CCCC` (Cyan)
- Security: `#FF0000` (Red)
- Jobs: `#6B48A8` (Purple)
- Other: `#666666` (Gray)

## 📝 Key Features

### OAuth Authentication
```javascript
const login = useGoogleLogin({
  onSuccess: tokenResponse => {
    // Fetch user info and set state
  },
  scope: 'openid profile email'
});
```

### Dynamic URL Scraping
```javascript
const backendUrl = 'http://localhost:5000/scrape?url=' + encodeURIComponent(url);
const response = await fetch(backendUrl);
```

### Data Categorization
Data is automatically categorized into 9 categories:
- AI, Tech, Startups, Tutorials, Open Source, Programming, Web, Security, Jobs

### Data Persistence
- Uses **localStorage** for data backup
- Saves user session
- Persists across page reloads

### Notifications
- **Errors:** Auto-hide after 10 seconds
- **Success:** Auto-hide after 5 seconds
- User can manually close notifications

### Button Controls
- **Scrape URL:** Fresh data from entered URL
  - Triggered by Enter key or clicking button
  - Disables Refresh during execution
  - Shows darker blue when active

- **Refresh:** Merge or fetch new data
  - Only triggered by clicking button
  - Disables Scrape URL during execution
  - Shows darker green when active

## 🔧 Configuration

### package.json Scripts

```json
{
  "scripts": {
    "start": "react-scripts start",      // Start dev server
    "build": "react-scripts build",      // Build for production
    "test": "react-scripts test"         // Run tests
  }
}
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456789.apps.googleusercontent.com` |
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:5000` |

## 🧪 Testing

### Manual Testing

1. **Login**
   ```
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Should see dashboard
   ```

2. **Scraping**
   ```
   - Enter: news.ycombinator.com
   - Click "Scrape URL" or press Enter
   - Wait for data to load
   - See categorized results
   ```

3. **Button Independence**
   ```
   - Click Scrape URL → Refresh grays out
   - Click Refresh → Scrape URL grays out
   - Enter key → Only Scrape URL works
   ```

4. **Notifications**
   ```
   - Invalid URL → Error shows for 10s
   - Valid URL → Success shows for 5s
   ```

5. **Persistence**
   ```
   - Scrape data
   - Refresh page (Ctrl+R)
   - Data still visible
   - User still logged in
   ```

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-scripts": "5.0.1",
  "@react-oauth/google": "^0.7.0"
}
```

### Installation
```bash
npm install
```

## 🚀 Production Build

```bash
# Create optimized production build
npm run build

# Build folder is ready to deploy
# Can be deployed to Vercel, Netlify, etc.
```

## 🔒 Security

- ✅ OAuth token handled securely
- ✅ No passwords stored in browser
- ✅ CORS requests to backend
- ✅ localStorage for non-sensitive data only
- ✅ User Agent spoofing for ethical scraping

## 🐛 Troubleshooting

### OAuth not working
- **Check:** Google Client ID in `.env`
- **Check:** Authorized origins in Google Console
- **Fix:** Clear cookies and try again

### Backend connection error
- **Check:** Backend is running on port 5000
- **Check:** `REACT_APP_API_URL` is correct
- **Check:** CORS is enabled on backend

### Data not showing
- **Check:** Website is accessible
- **Check:** Backend is running
- **Check:** Check browser console for errors

### Button states not changing
- Hard refresh page (Ctrl+Shift+R)
- Clear browser cache
- Check React DevTools

## 📚 Code Examples

### Scraping a Website
```javascript
const handleScrapeOnly = async () => {
  setActiveButton('scrape');
  
  const url = 'https://news.ycombinator.com';
  const response = await fetch(
    'http://localhost:5000/scrape?url=' + encodeURIComponent(url)
  );
  const data = await response.json();
  
  setData(data);
  setActiveButton(null);
};
```

### Handling Notifications
```javascript
// Auto-hide errors after 10 seconds
useEffect(() => {
  if (error) {
    const timer = setTimeout(() => setError(null), 10000);
    return () => clearTimeout(timer);
  }
}, [error]);
```

### localStorage Usage
```javascript
// Save data
localStorage.setItem('scraper_data', JSON.stringify(data));

// Load data
const savedData = localStorage.getItem('scraper_data');
```

## 🚢 Deployment

### Deploy to Vercel
```bash
npm run build
# Deploy 'build' folder to Vercel
```

### Deploy to Netlify
```bash
npm run build
# Deploy 'build' folder to Netlify
```

### Environment Variables for Production
Update `.env.production`:
```
REACT_APP_GOOGLE_CLIENT_ID=your_production_client_id
REACT_APP_API_URL=https://your-backend-url.com
```

## 📞 Support

For issues:
1. Check console logs (F12)
2. See Troubleshooting section
3. Verify configuration files
4. Check main README.md

---#   D e e p a k - A s s i n g m e n t - f r o n t e n d _  
 