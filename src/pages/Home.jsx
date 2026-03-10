import { useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import Skeleton from '../components/Skeleton'
import { supabase } from '../services/supabaseClient'
import '../styles/home.css'

const PRIMARY_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'venda', label: 'Venda' },
  { key: 'doacao', label: 'Doação' },
]

const BANNER_PATHS = {
  desktop: 'banner_home_desktop',
  mobile: 'banner_home_mobile',
}

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
  const [bannerUrls, setBannerUrls] = useState({ desktop: '', mobile: '' })
  const [isBannerLoading, setIsBannerLoading] = useState(true)

  const getBannerPublicUrl = (fileName) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from('fotos_produtos').getPublicUrl(`banners/${fileName}`)

    return publicUrl
  }

  const withCacheBusting = (url) => `${url}?t=${Date.now()}`

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

    const fetchBanners = async () => {
      setIsBannerLoading(true)

      const { data, error: listError } = await supabase.storage.from('fotos_produtos').list('banners', { limit: 50 })

      if (listError) {
        setBannerUrls({ desktop: '', mobile: '' })
        setIsBannerLoading(false)
        return
      }

      const fileNames = new Set((data ?? []).map((item) => item.name))
      setBannerUrls({
        desktop: fileNames.has(BANNER_PATHS.desktop) ? withCacheBusting(getBannerPublicUrl(BANNER_PATHS.desktop)) : '',
        mobile: fileNames.has(BANNER_PATHS.mobile) ? withCacheBusting(getBannerPublicUrl(BANNER_PATHS.mobile)) : '',
      })
      setIsBannerLoading(false)
    }

    fetchProdutos()
    fetchBanners()
  }, [])

  const filteredProducts = useMemo(() => {
    return produtos.filter((item) => activeTab === 'todos' || getCategoryType(item.categoria) === activeTab)
  }, [activeTab, produtos])

  const hasAnyBanner = Boolean(bannerUrls.desktop || bannerUrls.mobile)
  const shouldRenderBanner = isBannerLoading || hasAnyBanner

  return (
    <main className="home-page">
      <header className="home-hero">
        <h1>Cacarecos & Amenidades</h1>
      </header>

      {shouldRenderBanner && (
        <section className="home-banner" aria-label="Banner principal da home">
          {isBannerLoading ? (
            <Skeleton className="home-banner__skeleton" />
          ) : (
            <picture>
              {bannerUrls.mobile && <source media="(max-width: 767px)" srcSet={bannerUrls.mobile} />}
              {bannerUrls.desktop && <source media="(min-width: 768px)" srcSet={bannerUrls.desktop} />}
              <img
                src={bannerUrls.desktop || bannerUrls.mobile}
                alt="Destaque Cacarecos & Amenidades"
                className="home-banner__image"
                loading="lazy"
                decoding="async"
              />
            </picture>
          )}
        </section>
      )}

      {isLoading && (
        <section className="products-grid" role="status" aria-live="polite" aria-label="Carregando produtos">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={`home-skeleton-${index}`} className="product-card skeleton-card">
              <Skeleton className="skeleton-card__media" />
              <div className="skeleton-card__body">
                <Skeleton className="skeleton-card__line skeleton-card__line--category" />
                <Skeleton className="skeleton-card__line skeleton-card__line--title" />
                <Skeleton className="skeleton-card__line skeleton-card__line--tag" />
                <Skeleton className="skeleton-card__line skeleton-card__line--price" />
              </div>
            </article>
          ))}
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
          </section>

          <section className="products-grid" aria-label="Lista de produtos disponíveis">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item) => <ProductCard key={item.id} {...item} />)
            ) : (
              <article className="home-empty-state">
                <h2>Nenhum item com esse filtro</h2>
                <p>Tente outra categoria para encontrar novos itens.</p>
              </article>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default Home
