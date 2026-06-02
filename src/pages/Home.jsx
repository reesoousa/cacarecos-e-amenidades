import { useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import Skeleton from '../components/Skeleton'
import { supabase } from '../services/supabaseClient'
import '../styles/home.css'
import logoWhiteRetangular from '../visual-id/logo-cacarecos-white-retangular.svg'
import logoBlackRetangular from '../visual-id/logo-cacarecos-black-retangular.svg'
import logoWhiteLine from '../visual-id/logo-cacarecos-white-line.svg'
import logoBlackLine from '../visual-id/logo-cacarecos-black-line.svg'

const PRIMARY_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'venda', label: 'Venda' },
  { key: 'doacao', label: 'Doação' },
]

const STORE_MODES = {
  desapegos: 'desapegos',
  atelie: 'atelie',
}

const STORE_MODE_OPTIONS = [
  {
    key: STORE_MODES.desapegos,
    label: 'Desapegos',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7.5c0-1.38 1.12-2.5 2.5-2.5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Zm2.5-1a1 1 0 0 0-1 1v1.25h13V7.5a1 1 0 0 0-1-1h-11Zm12 3.75h-13v6.25a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-6.25Z" />
      </svg>
    ),
  },
  {
    key: STORE_MODES.atelie,
    label: 'Ateliê',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a9 9 0 1 0 9 9c0-1.5-1.2-2.7-2.7-2.7h-1.8a1.6 1.6 0 0 1-1.58-1.9l.16-.75A2.9 2.9 0 0 0 12.22 3H12Zm-4.5 8.25a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm4-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm4 2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm-8 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
      </svg>
    ),
  },
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
  const [activeSubcategory, setActiveSubcategory] = useState('todas')
  const [sortOrder, setSortOrder] = useState('recentes')
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

  const tabFilteredProducts = useMemo(() => {
    if (isAtelieMode) return produtos.filter((item) => item.is_feito_a_mao === true)
    return produtos.filter((item) => activeTab === 'todos' || getCategoryType(item.categoria) === activeTab)
  }, [activeTab, isAtelieMode, produtos])

  const availableSubcategories = useMemo(() => {
    const subs = new Set(tabFilteredProducts.map((item) => item.subcategoria).filter(Boolean))
    return [...subs].sort()
  }, [tabFilteredProducts])

  const filteredProducts = useMemo(() => {
    let items = activeSubcategory !== 'todas'
      ? tabFilteredProducts.filter((item) => item.subcategoria === activeSubcategory)
      : tabFilteredProducts

    if (sortOrder === 'preco-asc') return [...items].sort((a, b) => (a.preco ?? 0) - (b.preco ?? 0))
    if (sortOrder === 'preco-desc') return [...items].sort((a, b) => (b.preco ?? 0) - (a.preco ?? 0))
    return items
  }, [tabFilteredProducts, activeSubcategory, sortOrder])

  const hasAnyBanner = Boolean(bannerUrls.desktop || bannerUrls.mobile)
  const shouldRenderBanner = !isAtelieMode && (isBannerLoading || hasAnyBanner)

  return (
    <main className={`home-page ${isAtelieMode ? 'is-atelie' : ''}`}>
      <div className={`theme-wave-layer ${isAtelieMode ? 'is-atelie' : ''}`} aria-hidden="true" />
      <header className={`home-hero ${isAtelieMode ? 'is-atelie' : ''}`}>
        <div className="home-hero__brand-row">
          <div className="home-hero__logo" aria-label="Logo Cacarecos & Amenidades">
            <picture>
              <source media="(min-width: 840px)" srcSet={isAtelieMode ? logoBlackLine : logoWhiteLine} />
              <img
                src={isAtelieMode ? logoBlackRetangular : logoWhiteRetangular}
                alt="Cacarecos & Amenidades"
                className="home-hero__logo-img"
                draggable="false"
              />
            </picture>
          </div>

          <div className="store-mode-switch" role="tablist" aria-label="Modo da loja">
            <span className={`store-mode-switch__indicator ${isAtelieMode ? 'is-atelie' : ''}`} aria-hidden="true" />
            {STORE_MODE_OPTIONS.map((option) => {
              const isActive = storeMode === option.key

              return (
                <button
                  key={option.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={option.label}
                  className={`store-mode-switch__button ${isActive ? 'is-active' : ''}`}
                  onClick={() => { setStoreMode(option.key); setActiveSubcategory('todas'); setSortOrder('recentes') }}
                >
                  <span className="store-mode-switch__icon">{option.icon}</span>
                  <span className="store-mode-switch__label">{option.label}</span>
                </button>
              )
            })}
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
                <Skeleton className="skeleton-card__line skeleton-card__line--title" />
                <div className="skeleton-card__tags">
                  <Skeleton className="skeleton-card__line skeleton-card__line--tag" />
                  <Skeleton className="skeleton-card__line skeleton-card__line--tag" />
                </div>
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
              <div className="filters-row">
                <div className="filters-tabs hide-scrollbar">
                  {PRIMARY_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`filters-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                      onClick={() => { setActiveTab(tab.key); setActiveSubcategory('todas') }}
                      aria-pressed={activeTab === tab.key}
                    >
                      {tab.label}
                    </button>
                  ))}

                  {availableSubcategories.length > 0 && (
                    <>
                      <span className="filters-divider" aria-hidden="true" />
                      {availableSubcategories.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          className={`subcategory-chip ${activeSubcategory === sub ? 'is-active' : ''}`}
                          onClick={() => setActiveSubcategory(activeSubcategory === sub ? 'todas' : sub)}
                          aria-pressed={activeSubcategory === sub}
                        >
                          {sub}
                        </button>
                      ))}
                    </>
                  )}
                </div>

                <div className="filters-sort-wrapper">
                  <select
                    className="filters-sort"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    aria-label="Ordenar produtos"
                  >
                    <option value="recentes">Recentes</option>
                    <option value="preco-asc">Menor preço</option>
                    <option value="preco-desc">Maior preço</option>
                  </select>
                  <svg className="filters-sort-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </div>
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
