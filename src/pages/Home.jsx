import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { supabase } from '../services/supabaseClient'
import '../styles/home.css'

function Home() {
  const [produtos, setProdutos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProdutos = async () => {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError('Não foi possível carregar os produtos no momento. Tente novamente em instantes.')
        setProdutos([])
      } else {
        setProdutos(data ?? [])
      }

      setIsLoading(false)
    }

    fetchProdutos()
  }, [])

  return (
    <main className="home-page">
      <header className="home-hero">
        <p className="home-hero__eyebrow">Venda de garagem digital</p>
        <h1>Cacarecos & Amenidades</h1>
        <p className="home-hero__description">
          Um espaço para desapegar com carinho: venda ou doe itens em bom estado para quem realmente vai
          aproveitar.
        </p>
      </header>

      {isLoading && (
        <section className="home-feedback" role="status" aria-live="polite" aria-label="Carregando produtos">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Carregando produtos...</p>
        </section>
      )}

      {!isLoading && error && (
        <section className="home-feedback home-feedback--error" role="alert">
          <p>{error}</p>
        </section>
      )}

      {!isLoading && !error && (
        <section className="products-grid" aria-label="Lista de produtos disponíveis">
          {produtos.length > 0 ? (
            produtos.map((item) => <ProductCard key={item.id} {...item} />)
          ) : (
            <article className="home-empty-state">
              <h2>Nenhum produto publicado ainda</h2>
              <p>Assim que novos itens forem cadastrados, eles aparecerão aqui.</p>
            </article>
          )}
        </section>
      )}
    </main>
  )
}

export default Home
