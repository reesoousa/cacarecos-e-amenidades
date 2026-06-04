import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import ProductDetails from './pages/ProductDetails'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import { CartProvider, useCart } from './contexts/CartContext'
import { ToastProvider } from './contexts/ToastContext'
import { supabase } from './services/supabaseClient'
import './styles/cart.css'
import './styles/toast.css'

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

function CartFab() {
  const { items, openCart } = useCart()
  const count = items.length
  return (
    <button
      type="button"
      className={`cart-fab ${count === 0 ? 'cart-fab--hidden' : ''}`}
      onClick={openCart}
      aria-label={`Abrir lista de interesse (${count} ${count === 1 ? 'item' : 'itens'})`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" stroke="#03210e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span>Minha lista</span>
      {count > 0 && <span className="cart-fab__badge">{count}</span>}
    </button>
  )
}

function PublicLayout() {
  return (
    <CartProvider>
      <Outlet />
      <Footer />
      <CartDrawer />
      <CartFab />
    </CartProvider>
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
    <ToastProvider>
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
    </ToastProvider>
  )
}

export default App
