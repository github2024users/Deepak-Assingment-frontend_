import React, { useState, useEffect } from 'react';

export default function Dashboard({ user, onLogout }) {

  // State variables
  const [data, setData] = useState({});          // Stores scraped categorized stories
  const [url, setUrl] = useState('');            // URL currently typed
  const [loading, setLoading] = useState(false); // Loading state during fetch
  const [error, setError] = useState(null);      // Error message
  const [successMessage, setSuccessMessage] = useState(''); // Success notification
  const [lastUrl, setLastUrl] = useState('');    // Last scraped URL
  const [activeButton, setActiveButton] = useState(null); // Disable UI spam clicks
  const [websiteSummary, setWebsiteSummary] = useState(null); // NEW: Store website summary

  /* ---------------------------------------------------------
     Auto-clear error after 10 seconds
  --------------------------------------------------------- */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /* ---------------------------------------------------------
     Auto-clear success message after 5 seconds
  --------------------------------------------------------- */
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /* ---------------------------------------------------------
     Load saved data and check backend connection every 30 sec
     Now also loads website summary from localStorage
     IMPORTANT: Only logs out if server is completely unreachable
  --------------------------------------------------------- */
  useEffect(() => {
    // Load saved scraped data
    const savedData = localStorage.getItem('scraper_data');
    const savedUrl = localStorage.getItem('scraper_last_url');
    const savedSummary = localStorage.getItem('scraper_website_summary'); // NEW: Load saved summary

    if (savedData) setData(JSON.parse(savedData));
    if (savedUrl) setLastUrl(savedUrl);
    if (savedSummary) setWebsiteSummary(JSON.parse(savedSummary)); // NEW: Restore summary

    // Health check function - pings backend to ensure it's running
    // Only logs out if server is completely down, NOT during normal operations
    let consecutiveFailures = 0; // Track consecutive failures
    const MAX_FAILURES = 3; // Allow 3 failures before logging out
    
    const checkServerHealth = async () => {
      try {
        // Simple health check - just ping the server
        const backendUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/health';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(backendUrl, { 
          signal: controller.signal,
          method: 'GET'
        });
        
        clearTimeout(timeoutId);
        
        // If server responds (even with error), it's running
        // Reset failure counter on successful response
        consecutiveFailures = 0;
        
      } catch (err) {
        // Only count as failure if it's a network error, not just any error
        if (err.name === 'AbortError' || err.message.includes('fetch')) {
          consecutiveFailures++;
          console.warn(`Server health check failed (${consecutiveFailures}/${MAX_FAILURES}):`, err.message);
          
          // Only logout after multiple consecutive failures
          if (consecutiveFailures >= MAX_FAILURES) {
            console.error('Server appears to be down after multiple checks');
            onLogout();
            setError('⚠️ Server connection lost. Please check if the backend is running and log in again.');
          }
        } else {
          // Not a connection error, reset counter
          consecutiveFailures = 0;
        }
      }
    };

    // Initial health check
    checkServerHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkServerHealth, 30000);

    return () => clearInterval(interval);
  }, [onLogout]);


  /* ---------------------------------------------------------
     SCRAPING HANDLERS
  --------------------------------------------------------- */

  // Basic scrape (fresh) - scrapes a new URL
  const handleScrapeOnly = async () => {
    if (!url.trim()) return setError('Please enter a valid URL');
    setActiveButton('scrape');
    await performScrape(url, false);
    setActiveButton(null);
  };

  // Handle Enter key press in input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleScrapeOnly();
    }
  };

  // Refresh button - merges new data if same URL, otherwise fresh scrape
  const handleRefreshOnly = async () => {
    if (!url.trim()) return setError('Please enter a valid URL to refresh');
    setActiveButton('refresh');

    let formatted = url.startsWith('http') ? url : 'https://' + url;

    await performScrape(url, lastUrl === formatted);
    setActiveButton(null);
  };


  /* ---------------------------------------------------------
     Core scraping function that performs fetch to backend
     - Handles full scrape or merge mode
     - Now also extracts and saves website summary
     - Prevents duplicate entries by checking link URLs
  --------------------------------------------------------- */
  const performScrape = async (urlToScrape, isMerge) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      // Format URL with https:// if not present
      let formatted = urlToScrape.startsWith('http')
        ? urlToScrape
        : 'https://' + urlToScrape;

      // Construct backend API URL
      const backendUrl =
        (process.env.REACT_APP_API_URL || 'http://localhost:5000')
        + '/scrape?url='
        + encodeURIComponent(formatted);

      // Make request to backend
      const res = await fetch(backendUrl, { timeout: 30000 });

      if (!res.ok) {
        throw new Error((await res.json()).error || 'Backend error');
      }

      const json = await res.json();

      // NEW: Extract website summary from response (it comes as first key)
      const summary = json.website_summary;
      
      // Remove website_summary from json to get only categorized data
      const { website_summary, ...categorizedData } = json;

      // Check if categorized data contains anything useful
      const hasData = Object.values(categorizedData).some(arr => arr?.length > 0);

      if (hasData || summary) {
        if (isMerge && lastUrl === formatted) {
          // MERGE MODE: Add only NEW unique items (prevent duplicates)
          console.log('Merge mode: Checking for new unique items...');
          
          const merged = { ...data };
          let totalNewItems = 0;
          
          Object.keys(categorizedData).forEach(category => {
            // Get existing items in this category
            const existingItems = merged[category] || [];
            const newItems = categorizedData[category] || [];
            
            // Create a Set of existing links AND titles to check for duplicates
            // Check both link and title to be extra safe
            const existingLinks = new Set(existingItems.map(item => item.link));
            const existingTitles = new Set(existingItems.map(item => item.title.toLowerCase().trim()));
            
            // Filter out duplicates - item must have unique link AND title
            const uniqueNewItems = newItems.filter(item => {
              const linkIsUnique = !existingLinks.has(item.link);
              const titleIsUnique = !existingTitles.has(item.title.toLowerCase().trim());
              
              // Only add if BOTH link and title are unique (or if link is # which means no link)
              return (linkIsUnique && titleIsUnique) || (item.link === '#' && titleIsUnique);
            });
            
            if (uniqueNewItems.length > 0) {
              console.log(`Category "${category}": Found ${uniqueNewItems.length} new unique items`);
              totalNewItems += uniqueNewItems.length;
            }
            
            // Merge: existing items + only unique new items
            merged[category] = [...existingItems, ...uniqueNewItems];
          });
          
          // Update state with merged data
          setData(merged);
          localStorage.setItem('scraper_data', JSON.stringify(merged));
          
          // Show meaningful feedback to user
          if (totalNewItems > 0) {
            setSuccessMessage(`✅ Refresh complete! Added ${totalNewItems} new unique item${totalNewItems > 1 ? 's' : ''}.`);
            console.log(`Successfully added ${totalNewItems} new items`);
          } else {
            setSuccessMessage('ℹ️ No new items found. All content is already up to date!');
            console.log('No new items - data is current');
          }
          
          // Keep the original website summary when merging
        } else {
          // FRESH SCRAPE MODE: Replace all data
          console.log('Fresh scrape mode: Replacing all data');
          setData(categorizedData);
          setWebsiteSummary(summary);
          setLastUrl(formatted);
          localStorage.setItem('scraper_data', JSON.stringify(categorizedData));
          localStorage.setItem('scraper_website_summary', JSON.stringify(summary));
          
          const itemCount = Object.values(categorizedData).reduce((sum, arr) => sum + arr.length, 0);
          setSuccessMessage(`✅ Successfully scraped ${itemCount} items from ${formatted}`);
          console.log(`Fresh scrape complete: ${itemCount} items`);
        }
      } else {
        setError('No data found on this URL. Try another website.');
      }

    } catch (err) {
      console.error(err);
      setError(`Failed to scrape: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  /* ---------------------------------------------------------
    Utility to clear all records including website summary
  --------------------------------------------------------- */
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all data?')) {
      setData({});
      setLastUrl('');
      setWebsiteSummary(null); // NEW: Clear website summary
      localStorage.removeItem('scraper_data');
      localStorage.removeItem('scraper_website_summary'); // NEW: Remove from storage
      setSuccessMessage('All data cleared.');
    }
  };

  /* ---------------------------------------------------------
    Category helpers for UI - colors and ordering
  --------------------------------------------------------- */
  const categoryColors = {
    Tech: '#FF6600',
    AI: '#0066FF',
    Startups: '#FF1493',
    Tutorials: '#00AA00',
    OpenSource: '#9900FF',
    Programming: '#FF9900',
    Web: '#00CCCC',
    Security: '#FF0000',
    Jobs: '#6B48A8',
    Other: '#666666'
  };

  const categoryOrder = [
    'Jobs','AI','Tech','Startups','Tutorials',
    'Open Source','Programming','Web','Security','Other'
  ];

  // Calculate total number of scraped items
  const totalItems = Object.values(data).reduce((s, arr) => s + (arr?.length || 0), 0);


  /* ---------------------------------------------------------
    RENDER SECTION
  --------------------------------------------------------- */
  return (
    <div>
      {/* Top bar: user info + actions */}
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <img src={user.picture} alt="avatar" style={{width:48,height:48,borderRadius:24}} />
          <div>
            <strong>{user.name}</strong><br/>
            <span style={{fontSize:12,color:'#555'}}>{user.email}</span>
          </div>
        </div>

        <div style={{display:'flex', gap:8}}>
          <button className="button secondary" onClick={handleClearAll}>Clear All</button>
          <button className="button" onClick={handleRefreshOnly}>🔄 Refresh</button>
          <button className="button secondary" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Input section */}
      <section>
        <h2 style={{color:'#0d6efd'}}>Web Scraper Portal</h2>
        <p style={{color:'#666'}}>Enter any website URL to scrape and organize content by categories</p>

        {/* URL input container */}
        <div style={{background:'#f8f9fa', padding:20, borderRadius:8}}>
          <div style={{display:'flex', gap:8}}>
            <input
              type="text"
              placeholder="Enter website URL (e.g., github.com, news.ycombinator.com, linkedin.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{flex:1, padding:'10px', borderRadius:'4px', border:'1px solid #ddd'}}
            />
            <button 
              className="button" 
              onClick={handleScrapeOnly}
              disabled={loading || activeButton === 'scrape'}
            >
              {loading && activeButton === 'scrape' ? 'Scraping...' : 'Scrape'}
            </button>
          </div>

          {/* Error box */}
          {error && (
            <div style={{
              color:'#d32f2f', 
              background:'#ffebee', 
              padding:'10px', 
              borderRadius:'4px', 
              marginTop:'10px',
              border:'1px solid #ef5350'
            }}>
              {error}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div style={{
              color:'#2e7d32', 
              background:'#e8f5e9', 
              padding:'10px', 
              borderRadius:'4px', 
              marginTop:'10px',
              border:'1px solid #66bb6a'
            }}>
              {successMessage}
            </div>
          )}

          <div style={{marginTop:12}}>
            <strong>Total Items:</strong> {totalItems}
            {lastUrl && <div><strong>Last URL:</strong> {lastUrl}</div>}
          </div>
        </div>

        {/* NEW: Website Summary Card - Shows comprehensive info about the scraped website */}
        {websiteSummary && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: '24px',
            borderRadius: '12px',
            marginTop: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <span style={{fontSize:'32px'}}>🌐</span>
                <h3 style={{margin:0, fontSize:'24px'}}>Website Information</h3>
              </div>
              {/* Favicon display if available */}
              {websiteSummary.favicon && (
                <img 
                  src={websiteSummary.favicon} 
                  alt="favicon" 
                  style={{width:'32px', height:'32px', borderRadius:'4px', background:'white', padding:'4px'}}
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
            </div>
            
            {/* Main info grid - 2 columns for better organization */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              {/* Left Column */}
              <div style={{
                background: 'rgba(255,255,255,0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                {/* Website Title */}
                <div style={{marginBottom:'12px'}}>
                  <strong style={{fontSize:'14px', display:'block', marginBottom:'4px', opacity:0.9}}>
                    📌 Title
                  </strong>
                  <span style={{fontSize:'16px', fontWeight:'500'}}>{websiteSummary.title}</span>
                </div>

                {/* Domain */}
                <div style={{marginBottom:'12px'}}>
                  <strong style={{fontSize:'14px', display:'block', marginBottom:'4px', opacity:0.9}}>
                    🔗 Domain
                  </strong>
                  <span style={{fontSize:'14px', fontFamily:'monospace'}}>{websiteSummary.domain}</span>
                </div>

                {/* Website Type */}
                <div style={{marginBottom:'12px'}}>
                  <strong style={{fontSize:'14px', display:'block', marginBottom:'4px', opacity:0.9}}>
                    🏷️ Type
                  </strong>
                  <span style={{
                    background: 'rgba(255,255,255,0.25)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    display: 'inline-block',
                    fontWeight: '500'
                  }}>
                    {websiteSummary.type}
                  </span>
                </div>

                {/* Language */}
                <div style={{marginBottom:'12px'}}>
                  <strong style={{fontSize:'14px', display:'block', marginBottom:'4px', opacity:0.9}}>
                    🌍 Language
                  </strong>
                  <span style={{fontSize:'14px'}}>{websiteSummary.language}</span>
                </div>

                {/* Site Name */}
                {websiteSummary.site_name && websiteSummary.site_name !== websiteSummary.domain && (
                  <div style={{marginBottom:'12px'}}>
                    <strong style={{fontSize:'14px', display:'block', marginBottom:'4px', opacity:0.9}}>
                      🌟 Site Name
                    </strong>
                    <span style={{fontSize:'14px'}}>{websiteSummary.site_name}</span>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div style={{
                background: 'rgba(255,255,255,0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                {/* Author */}
                {websiteSummary.author && websiteSummary.author !== 'Not specified' && (
                  <div style={{marginBottom:'12px'}}>
                    <strong style={{fontSize:'14px', display:'block', marginBottom:'4px', opacity:0.9}}>
                      ✍️ Author
                    </strong>
                    <span style={{fontSize:'14px'}}>{websiteSummary.author}</span>
                  </div>
                )}

                {/* Publisher */}
                {websiteSummary.publisher && websiteSummary.publisher !== 'Not specified' && (
                  <div style={{marginBottom:'12px'}}>
                    <strong style={{fontSize:'14px', display:'block', marginBottom:'4px', opacity:0.9}}>
                      📰 Publisher
                    </strong>
                    <span style={{fontSize:'14px'}}>{websiteSummary.publisher}</span>
                  </div>
                )}

                {/* Theme Color */}
                {websiteSummary.theme_color && (
                  <div style={{marginBottom:'12px'}}>
                    <strong style={{fontSize:'14px', display:'block', marginBottom:'4px', opacity:0.9}}>
                      🎨 Theme Color
                    </strong>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <div style={{
                        width:'24px', 
                        height:'24px', 
                        background:websiteSummary.theme_color, 
                        borderRadius:'4px',
                        border:'2px solid rgba(255,255,255,0.5)'
                      }}></div>
                      <span style={{fontSize:'13px', fontFamily:'monospace'}}>{websiteSummary.theme_color}</span>
                    </div>
                  </div>
                )}

                {/* App Name */}
                {websiteSummary.app_name && (
                  <div style={{marginBottom:'12px'}}>
                    <strong style={{fontSize:'14px', display:'block', marginBottom:'4px', opacity:0.9}}>
                      📱 App Name
                    </strong>
                    <span style={{fontSize:'14px'}}>{websiteSummary.app_name}</span>
                  </div>
                )}

                {/* Copyright */}
                {websiteSummary.copyright && (
                  <div style={{marginBottom:'12px'}}>
                    <strong style={{fontSize:'14px', display:'block', marginBottom:'4px', opacity:0.9}}>
                      ©️ Copyright
                    </strong>
                    <span style={{fontSize:'12px', opacity:0.9}}>{websiteSummary.copyright}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Full-width sections */}
            <div style={{
              background: 'rgba(255,255,255,0.1)', 
              padding: '16px', 
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              marginBottom: '12px'
            }}>
              {/* Website Description */}
              <strong style={{fontSize:'14px', display:'block', marginBottom:'8px', opacity:0.9}}>
                📝 About
              </strong>
              <p style={{
                margin: 0, 
                fontSize:'14px', 
                lineHeight:'1.7',
                background: 'rgba(255,255,255,0.1)',
                padding: '12px',
                borderRadius: '6px'
              }}>
                {websiteSummary.description}
              </p>
            </div>

            {/* Keywords */}
            {websiteSummary.keywords && (
              <div style={{
                background: 'rgba(255,255,255,0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                marginBottom: '12px'
              }}>
                <strong style={{fontSize:'14px', display:'block', marginBottom:'8px', opacity:0.9}}>
                  🔑 Keywords
                </strong>
                <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                  {websiteSummary.keywords.split(',').map((keyword, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Image Preview */}
            {websiteSummary.image && (
              <div style={{
                background: 'rgba(255,255,255,0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                <strong style={{fontSize:'14px', display:'block', marginBottom:'8px', opacity:0.9}}>
                  🖼️ Featured Image
                </strong>
                <img 
                  src={websiteSummary.image} 
                  alt="Featured" 
                  style={{
                    maxWidth:'100%', 
                    maxHeight:'200px', 
                    borderRadius:'6px',
                    display:'block'
                  }}
                  onError={(e) => e.target.parentElement.style.display = 'none'}
                />
              </div>
            )}
          </div>
        )}

        {/* No data state */}
        {totalItems === 0 && !websiteSummary && (
          <div style={{
            textAlign:'center', 
            padding:'40px', 
            color:'#666',
            background:'#f8f9fa',
            borderRadius:'8px',
            marginTop:'20px'
          }}>
            <div style={{fontSize:'48px', marginBottom:'12px'}}>📊</div>
            <p style={{fontSize:'18px', margin:0}}>No data yet — try scraping a URL above</p>
          </div>
        )}

        {/* Category sections - Display scraped content organized by categories */}
        {totalItems > 0 && (
          <div style={{display:'flex', flexDirection:'column', gap:20, marginTop:20}}>
            {categoryOrder.map(category => {
              const stories = data[category] || [];
              if (stories.length === 0) return null;

              const color = categoryColors[category];
              return (
                <div key={category} style={{
                  border:`2px solid ${color}`, 
                  borderRadius:8,
                  overflow:'hidden',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {/* Category Header */}
                  <div style={{
                    background:color, 
                    color:'#fff', 
                    padding:12,
                    display:'flex',
                    justifyContent:'space-between',
                    alignItems:'center'
                  }}>
                    <strong style={{fontSize:'18px'}}>{category}</strong>
                    <span style={{
                      background:'rgba(255,255,255,0.3)',
                      padding:'4px 12px',
                      borderRadius:'12px',
                      fontSize:'14px'
                    }}>
                      {stories.length} items
                    </span>
                  </div>

                  {/* Category Content */}
                  <div style={{padding:12, background:'#fff'}}>
                    {stories.map((story, i) => (
                      <div key={i} style={{
                        marginBottom:12,
                        paddingBottom:12,
                        borderBottom: i < stories.length - 1 ? '1px solid #eee' : 'none'
                      }}>
                        {/* Story Title (clickable link) */}
                        <a 
                          href={story.link} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{
                            color:'#0d6efd',
                            textDecoration:'none',
                            fontSize:'16px',
                            fontWeight:'500',
                            display:'block',
                            marginBottom:'6px'
                          }}
                          onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {story.title}
                        </a>
                        
                        {/* Source/Company */}
                        <div style={{fontSize:12, color:'#666', marginBottom:'4px'}}>
                          📌 Source: {story.company}
                        </div>
                        
                        {/* Snippet/Description */}
                        {story.snippet && (
                          <div style={{
                            fontSize:13, 
                            color:'#444',
                            lineHeight:'1.5',
                            background:'#f8f9fa',
                            padding:'8px',
                            borderRadius:'4px'
                          }}>
                            {story.snippet}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}