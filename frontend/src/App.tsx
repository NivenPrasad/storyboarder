/**
 * =============================================================================
 * APP.TSX - MAIN APPLICATION COMPONENT (Router)
 * =============================================================================
 *
 * This is the "traffic controller" of the application. It decides which page
 * to show based on the URL in the browser.
 *
 * HOW ROUTING WORKS:
 * - User visits "/login" → Show the Login page
 * - User visits "/dashboard" → Show the Dashboard page
 * - User visits "/storyboard/abc123" → Show that specific storyboard
 *
 * This file also handles authentication protection:
 * - Some pages (Dashboard, Editor) require you to be logged in
 * - Some pages (Login, Register) should redirect away if already logged in
 */

// useEffect runs code when the component loads (like checking if user is logged in)
import { useEffect } from 'react';

// React Router components for handling URL-based navigation
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Our global state store (contains user info, login status, etc.)
import { useStore } from './store/useStore';

// Layout wraps protected pages with navigation bar and common UI
import Layout from './components/Layout';

// All the page components
import Landing from './pages/Landing';           // Home page (when not logged in)
import Login from './pages/Login';               // Login form
import Register from './pages/Register';         // Sign up form
import Dashboard from './pages/Dashboard';       // List of user's storyboards
import StoryboardEditor from './pages/StoryboardEditor'; // Edit a storyboard
import SharedStoryboard from './pages/SharedStoryboard'; // View a shared storyboard
import Templates from './pages/Templates';       // Browse templates


/**
 * PRIVATE ROUTE - Protects pages that require login
 *
 * If user is NOT logged in → Redirect to /login
 * If user IS logged in → Show the requested page
 *
 * While checking auth status, shows a loading spinner to prevent flashing.
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  // Get authentication state from our global store
  const { isAuthenticated, isLoading } = useStore();

  // Still checking if user is logged in? Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Animated spinning circle */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not logged in? Send them to the login page
  // "replace" means this redirect won't be saved in browser history
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated! Show the protected content
  return <>{children}</>;
}


/**
 * PUBLIC ROUTE - For pages that should NOT be shown to logged-in users
 *
 * If user IS logged in → Redirect to /dashboard
 * If user is NOT logged in → Show the page (login, register)
 *
 * This prevents logged-in users from seeing the login page again.
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useStore();

  // Still checking auth? Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Already logged in? No need to see login/register - go to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not logged in - show the public page (login/register)
  return <>{children}</>;
}


/**
 * APP - The main application component
 *
 * Sets up routing and checks authentication status when the app loads.
 */
function App() {
  // Get the checkAuth function from our store
  const { checkAuth } = useStore();

  // When the app first loads, check if user has a saved login session
  // This runs once when the component "mounts" (appears on screen)
  useEffect(() => {
    checkAuth(); // Checks localStorage for a saved auth token
  }, [checkAuth]);

  return (
    // BrowserRouter enables URL-based routing throughout the app
    <BrowserRouter>
      {/* Routes is a container for all our route definitions */}
      <Routes>

        {/* ============ PUBLIC ROUTES ============ */}

        {/* Landing page - shown to everyone at the root URL */}
        <Route path="/" element={<Landing />} />

        {/* Login page - redirects to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Registration page - redirects to dashboard if already logged in */}
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* ============ PROTECTED ROUTES (Require Login) ============ */}

        {/* Dashboard - shows all your storyboards */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>  {/* Wraps content with navigation bar */}
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Storyboard Editor - edit a specific storyboard */}
        {/* :id is a URL parameter - e.g., /storyboard/abc123 */}
        <Route
          path="/storyboard/:id"
          element={
            <PrivateRoute>
              <Layout>
                <StoryboardEditor />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Templates page - browse and use storyboard templates */}
        <Route
          path="/templates"
          element={
            <PrivateRoute>
              <Layout>
                <Templates />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* ============ SPECIAL ROUTES ============ */}

        {/* Shared storyboard - anyone with the link can view (no login required) */}
        {/* :shareLink is the unique sharing code */}
        <Route path="/shared/:shareLink" element={<SharedStoryboard />} />

        {/* Catch-all route - any unknown URL redirects to home */}
        {/* The "*" matches anything that didn't match above */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

// Export the App component so main.tsx can use it
export default App;
