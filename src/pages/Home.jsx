import { useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { supabase } from '../services/supabaseClient'
import '../styles/home.css'

const PRIMARY_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'venda', label: 'Venda' },
  { key: 'doacao', label: 'Doação' },
]

const normalizeText = (value = '') =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

const getCategoryType = (categoria) => {
  const normalized = normalizeText(categoria)

  if (normalized.includes('doacao')) {
    return 'doacao'
  }

  if (normalized.includes('venda')) {
    return 'venda'
  }

  return 'outros'
}

function Home() {
  const [produtos, setProdutos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('todos')
  const [selectedSubcategory, setSelectedSubcategory] = useState('todas')

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

  const subcategories = useMemo(() => {
    const base = activeTab === 'todos' ? produtos : produtos.filter((item) => getCategoryType(item.categoria) === activeTab)

    return [...new Set(base.map((item) => item.subcategoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [activeTab, produtos])

  useEffect(() => {
    if (selectedSubcategory !== 'todas' && !subcategories.includes(selectedSubcategory)) {
      setSelectedSubcategory('todas')
    }
  }, [selectedSubcategory, subcategories])

  const filteredProducts = useMemo(() => {
    return produtos.filter((item) => {
      const matchesTab = activeTab === 'todos' || getCategoryType(item.categoria) === activeTab
      const matchesSubcategory = selectedSubcategory === 'todas' || item.subcategoria === selectedSubcategory

      return matchesTab && matchesSubcategory
    })
  }, [activeTab, produtos, selectedSubcategory])

  return (
    <main className="home-page">
      <header className="home-hero">
        <p className="home-hero__eyebrow">Venda de Garagem</p>
        <h1>Cacarecos e Amenidades</h1>
        <p className="home-hero__description">
          Nossa lojinha digital para desapegos e doações. Explore os itens, encontre algo que goste e reserve direto
          com a gente pelo WhatsApp.
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
        <>
          <section className="filters-bar" aria-label="Filtros de busca">
            <div className="filters-tabs" role="tablist" aria-label="Tipo de anúncio">
              {PRIMARY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`filters-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="filters-secondary">
              <p>Subcategorias</p>
              <div className="subcategories-chips hide-scrollbar" role="list" aria-label="Subcategorias">
                <button
                  type="button"
                  className={`subcategory-chip ${selectedSubcategory === 'todas' ? 'is-active' : ''}`}
                  onClick={() => setSelectedSubcategory('todas')}
                >
                  Todas
                </button>
                {subcategories.map((subcat) => (
                  <button
                    key={subcat}
                    type="button"
                    className={`subcategory-chip ${selectedSubcategory === subcat ? 'is-active' : ''}`}
                    onClick={() => setSelectedSubcategory(subcat)}
                  >
                    {subcat}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="products-grid" aria-label="Lista de produtos disponíveis">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item) => <ProductCard key={item.id} {...item} />)
            ) : (
              <article className="home-empty-state">
                <h2>Nenhum item com esse filtro</h2>
                <p>Tente outra categoria ou subcategoria para encontrar novos itens.</p>
              </article>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default Home
