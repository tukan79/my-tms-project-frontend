//app.jsx
import React, { useEffect } from 'react';

// Tymczasowy debug

function App() {
  useEffect(() => {
    console.log('✅ DEPLOYMENT SUCCESSFUL!');
    console.log('🌐 Environment:', import.meta.env.MODE);
    console.log('📍 Current URL:', window.location.href);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🎉 System TMS - Deployment Successful!</h1>
      <p>Check browser console for confirmation.</p>
    </div>
  );
}

export default App;