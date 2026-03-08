import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import ProductDetails from './pages/ProductDetails'
import Footer from './components/Footer'
import { supabase } from './services/supabaseClient'

function ProtectedRoute({ children, session, isAuthLoading }) {
  if (isAuthLoading) {
    return (
      <main className="home-page">
        <section className="home-feedback" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Validando acesso administrativo...</p>
        </section>
      </main>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicOnlyRoute({ children, session, isAuthLoading }) {
  if (isAuthLoading) {
    return (
      <main className="home-page">
        <section className="home-feedback" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Carregando sessão...</p>
        </section>
      </main>
    )
  }

  if (session) {
    return <Navigate to="/admin" replace />
  }

  return children
}

function PublicLayout() {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession()

      if (isMounted) {
        setSession(activeSession)
        setIsAuthLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsAuthLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/produto/:id" element={<ProductDetails />} />
      </Route>

      <Route
        path="/login"
        element={
          <PublicOnlyRoute session={session} isAuthLoading={isAuthLoading}>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute session={session} isAuthLoading={isAuthLoading}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
