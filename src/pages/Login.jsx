import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import '../styles/admin.css'

function Login() {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setCredentials((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (signInError) {
      setError('Não foi possível entrar. Confira e-mail e senha e tente novamente.')
      setIsSubmitting(false)
      return
    }

    navigate('/admin', { replace: true })
  }

  return (
    <main className="login-page">
      <section className="auth-card" aria-label="Acesso administrativo">
        <p className="auth-card__eyebrow">Área Administrativa</p>
        <h1>Entrar no painel</h1>
        <p className="auth-card__subtitle">Acesse com sua conta para gerenciar os produtos cadastrados.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={credentials.email}
            onChange={handleChange}
            placeholder="voce@email.com"
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={credentials.password}
            onChange={handleChange}
            placeholder="Sua senha"
          />

          {error && (
            <p className="auth-feedback auth-feedback--error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login
