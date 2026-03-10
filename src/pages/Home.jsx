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

const STORE_MODES = {
  desapegos: 'desapegos',
  atelie: 'atelie',
}

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
  const [storeMode, setStoreMode] = useState(STORE_MODES.desapegos)
  const [bannerUrls, setBannerUrls] = useState({ desktop: '', mobile: '' })
  const [isBannerLoading, setIsBannerLoading] = useState(true)

  const isAtelieMode = storeMode === STORE_MODES.atelie

  const getBannerPublicUrl = (fileName) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from('fotos_produtos').getPublicUrl(`banners/${fileName}`)

    return publicUrl
  }

  const withCacheBusting = (url) => `${url}?t=${Date.now()}`

  useEffect(() => {
    document.body.classList.toggle('theme-atelie', isAtelieMode)

    return () => {
      document.body.classList.remove('theme-atelie')
    }
  }, [isAtelieMode])

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
    if (isAtelieMode) {
      return produtos.filter((item) => item.is_feito_a_mao === true)
    }

    return produtos.filter((item) => activeTab === 'todos' || getCategoryType(item.categoria) === activeTab)
  }, [activeTab, isAtelieMode, produtos])

  const hasAnyBanner = Boolean(bannerUrls.desktop || bannerUrls.mobile)
  const shouldRenderBanner = !isAtelieMode && (isBannerLoading || hasAnyBanner)

  return (
    <main className={`home-page ${isAtelieMode ? 'is-atelie' : ''}`}>
      <header className={`home-hero ${isAtelieMode ? 'is-atelie' : ''}`}>
        <div className="home-hero__brand-row">
          <div className="home-hero__logo home-hero__logo--mobile" aria-label="Logo compacto Cacarecos & Amenidades">
            C&A
          </div>

          <div className="home-hero__logo home-hero__logo--desktop" aria-label="Logo horizontal Cacarecos & Amenidades">
            <span className="home-hero__logo-mark">C&A</span>
            <span className="home-hero__logo-text">Cacarecos & Amenidades</span>
          </div>

          <div className="store-mode-switch" role="tablist" aria-label="Modo da loja">
            <span className={`store-mode-switch__indicator ${isAtelieMode ? 'is-atelie' : ''}`} aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={!isAtelieMode}
              className={`store-mode-switch__button ${!isAtelieMode ? 'is-active' : ''}`}
              onClick={() => setStoreMode(STORE_MODES.desapegos)}
            >
              Desapegos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isAtelieMode}
              className={`store-mode-switch__button ${isAtelieMode ? 'is-active' : ''}`}
              onClick={() => setStoreMode(STORE_MODES.atelie)}
            >
              Ateliê
            </button>
          </div>
        </div>
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

      {isAtelieMode && (
        <>
          <section className="atelier-banner" aria-label="Banner do Ateliê">
            <div className="atelier-banner__content">
              <p>Ateliê Cacarecos</p>
              <h2>Cerâmicas autorais em pequenos lotes</h2>
            </div>
          </section>

          <section className="atelier-manifesto" aria-label="Manifesto do Ateliê">
            <h2>Do barro ao afeto</h2>
            <p>
              Cada peça nasce do gesto manual, do tempo de secagem e da queima cuidadosa. No ateliê, celebramos
              imperfeições orgânicas e criamos objetos para morar com você por muitos anos.
            </p>
          </section>
        </>
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
          {!isAtelieMode && (
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
          )}

          <section className="products-grid" aria-label="Lista de produtos disponíveis">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item) => <ProductCard key={item.id} {...item} />)
            ) : (
              <article className="home-empty-state">
                <h2>{isAtelieMode ? 'Nenhuma peça autoral disponível no momento' : 'Nenhum item com esse filtro'}</h2>
                <p>
                  {isAtelieMode
                    ? 'Novas coleções entram periodicamente. Volte em breve para descobrir novidades do ateliê.'
                    : 'Tente outra categoria para encontrar novos itens.'}
                </p>
              </article>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default Home
