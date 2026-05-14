/**
 * =============================================================================
 * MAIN.TSX - APPLICATION ENTRY POINT
 * =============================================================================
 *
 * This is where the React application starts! When you open the website,
 * the browser loads this file first, which then loads everything else.
 *
 * WHAT HAPPENS HERE:
 * 1. Import React and ReactDOM (the libraries that power our UI)
 * 2. Import our main App component (the actual application)
 * 3. Import global CSS styles
 * 4. Find the <div id="root"> in index.html and render our app inside it
 *
 * Think of this file as the "ignition key" that starts the whole application.
 */

// React is the library that lets us build user interfaces with components
import React from 'react'

// ReactDOM is the bridge between React and the actual web page (DOM)
import ReactDOM from 'react-dom/client'

// App is our main component that contains the entire application
import App from './App'

// Global CSS styles (Tailwind CSS utilities + custom styles)
import './index.css'

/**
 * This is where the magic happens!
 *
 * 1. document.getElementById('root') - Find the empty <div> in index.html
 * 2. ReactDOM.createRoot(...) - Create a React "root" in that div
 * 3. .render(...) - Put our App component inside it
 *
 * React.StrictMode is a helper that warns us about potential problems
 * during development. It doesn't affect the production build.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
