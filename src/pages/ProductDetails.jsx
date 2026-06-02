import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Skeleton from '../components/Skeleton'
import { supabase } from '../services/supabaseClient'
import '../styles/home.css'

const WHATSAPP_NUMBER = '5511966751161'
const PRODUCT_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1488998527040-85054a85150e?auto=format&fit=crop&w=1200&q=80'

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

const normalizeText = (value = '') =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

function ProductDetails() {
  const { id } = useParams()
  const [produto, setProduto] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [shareFeedback, setShareFeedback] = useState(false)
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [id])

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase.from('produtos').select('*').eq('id', id).single()

      if (fetchError || !data) {
        setError('Produto não encontrado ou indisponível no momento.')
        setProduto(null)
      } else {
        setProduto(data)
        supabase.rpc('increment_view_count', { product_id: id })
      }

      setIsLoading(false)
    }

    fetchProduct()
  }, [id])

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!produto?.id) {
        setRecommendedProducts([])
        setIsRecommendationsLoading(false)
        return
      }

      setIsRecommendationsLoading(true)

      const normalizedCurrentCategory = normalizeText(produto.categoria)

      const { data: sameCategoryData } = await supabase
        .from('produtos')
        .select('*')
        .neq('id', produto.id)
        .eq('status', 'Disponível')
        .order('created_at', { ascending: false })

      const sameCategory = (sameCategoryData ?? []).filter(
        (item) => normalizeText(item.categoria) === normalizedCurrentCategory
      )
      const prioritizedItems = sameCategory.slice(0, 4)

      if (prioritizedItems.length >= 4) {
        setRecommendedProducts(prioritizedItems)
        setIsRecommendationsLoading(false)
        return
      }

      const currentIds = new Set(prioritizedItems.map((item) => item.id))

      const fallbackItems = (sameCategoryData ?? [])
        .filter((item) => !currentIds.has(item.id))
        .slice(0, 4 - prioritizedItems.length)

      setRecommendedProducts([...prioritizedItems, ...fallbackItems])
      setIsRecommendationsLoading(false)
    }

    fetchRecommendations()
  }, [produto])

  const galleryImages = useMemo(() => {
    if (!produto || !Array.isArray(produto.fotos) || produto.fotos.length === 0) {
      return [PRODUCT_PLACEHOLDER_IMAGE]
    }

    return produto.fotos
  }, [produto])

  useEffect(() => {
    if (lightboxIndex === null) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setLightboxIndex(null)
      if (event.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length)
      if (event.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % galleryImages.length)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxIndex, galleryImages.length])

  const featuredImage = galleryImages[0]
  const secondaryImages = galleryImages.slice(1, 5)
  const remainingImagesCount = galleryImages.length - 5

  if (isLoading) {
    return (
      <main className="home-page">
        <section className="product-layout" role="status" aria-live="polite" aria-label="Carregando detalhes do produto">
          <div className="product-gallery product-gallery--skeleton">
            <Skeleton className="product-skeleton__featured" />
            <div className="product-skeleton__thumbs">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={`thumb-${index}`} className="product-skeleton__thumb" />
              ))}
            </div>
          </div>

          <article className="product-info product-info--skeleton">
            <Skeleton className="product-skeleton__line product-skeleton__line--category" />
            <Skeleton className="product-skeleton__line product-skeleton__line--title" />
            <Skeleton className="product-skeleton__line product-skeleton__line--price" />
            <Skeleton className="product-skeleton__line" />
            <Skeleton className="product-skeleton__line" />
            <Skeleton className="product-skeleton__line" />
            <Skeleton className="product-skeleton__cta" />
          </article>
        </section>
      </main>
    )
  }

  if (error || !produto) {
    return (
      <main className="home-page">
        <section className="home-feedback home-feedback--error" role="alert">
          <p>{error}</p>
        </section>
        <Link className="product-back-link" to="/">
          Voltar para a home
        </Link>
      </main>
    )
  }

  const normalizedCategoria = produto.categoria?.toLowerCase()
  const isDonation = normalizedCategoria === 'doação' || normalizedCategoria === 'doacao'
  const hasPrice = typeof produto.preco === 'number' && produto.preco > 0
  const isReserved = produto.status?.toLowerCase() === 'reservado'
  const priceText = isDonation || !hasPrice ? 'Doação' : priceFormatter.format(produto.preco)
  const currentPageUrl = window.location.href
  const waText = encodeURIComponent(
    `Oi! Vi o item *${produto.nome}* na lojinha e queria saber se ainda está disponível. Vamos aos negócios! 🔗 ${currentPageUrl}`
  )
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: produto.nome, url: currentPageUrl })
      } else {
        await navigator.clipboard.writeText(currentPageUrl)
        setShareFeedback(true)
        setTimeout(() => setShareFeedback(false), 2000)
      }
    } catch {
      // usuário cancelou
    }
  }

  return (
    <main className="home-page product-page">
      <Link className="product-back-link" to="/">
        ← Voltar para os itens
      </Link>

      <section className="product-layout" aria-label="Detalhes do produto">
        <div className="product-gallery">
          <div className="product-gallery-mobile hide-scrollbar" aria-label="Galeria mobile">
            {galleryImages.map((image, index) => (
              <button key={`${image}-${index}`} type="button" className="product-gallery-mobile__item" onClick={() => setLightboxIndex(index)}>
                <img
                  src={image}
                  alt={`Foto ${index + 1} de ${produto.nome}`}
                  loading="lazy"
                  className="w-full h-full object-cover product-gallery-mobile__image"
                />
              </button>
            ))}
          </div>

          <div className="product-gallery-desktop" aria-label="Galeria desktop">
            {galleryImages.length === 1 ? (
              <button type="button" className="product-gallery-desktop__single overflow-hidden" onClick={() => setLightboxIndex(0)}>
                <img src={featuredImage} alt={`Foto 1 de ${produto.nome}`} loading="lazy" className="w-full h-full object-cover" />
              </button>
            ) : (
              <>
                <button type="button" className="product-gallery-desktop__featured overflow-hidden" onClick={() => setLightboxIndex(0)}>
                  <img src={featuredImage} alt={`Foto 1 de ${produto.nome}`} loading="lazy" className="w-full h-full object-cover" />
                </button>

                <div className="product-gallery-desktop__secondary" style={{ '--secondary-rows': secondaryImages.length }}>
                  {secondaryImages.map((image, index) => {
                    const isLastVisibleThumb = index === secondaryImages.length - 1 && remainingImagesCount > 0

                    return (
                      <button
                        key={`${image}-desk-${index}`}
                        type="button"
                        className="product-gallery-desktop__item overflow-hidden"
                        onClick={() => setLightboxIndex(index + 1)}
                      >
                        <img src={image} alt={`Foto ${index + 2} de ${produto.nome}`} loading="lazy" className="w-full h-full object-cover" />
                        {isLastVisibleThumb && <span className="product-gallery-desktop__more">+{remainingImagesCount}</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <article className="product-info">
          <p className="product-info__category">{produto.categoria || 'Sem categoria'}</p>
          <h1>{produto.nome}</h1>
          <p className="product-info__price">{priceText}</p>

          <div className="product-info__badges">
            {isReserved && <span className="badge badge--reserved">Reservado</span>}
            {isDonation && <span className="badge badge--donation">Doação</span>}
            {produto.is_feito_a_mao && <span className="badge badge--handmade">Peça Autoral</span>}
          </div>

          {produto.descricao && <p className="product-info__description">{produto.descricao}</p>}

          <ul className="product-info__details">
            {produto.subcategoria && (
              <li>
                <strong>Subcategoria:</strong> {produto.subcategoria}
              </li>
            )}
            {produto.estado_uso && (
              <li>
                <strong>Estado de uso:</strong> {produto.estado_uso}
              </li>
            )}
            {produto.motivo_desapego && (
              <li>
                <strong>Motivo do desapego:</strong> {produto.motivo_desapego}
              </li>
            )}
            {produto.dimensoes && (
              <li>
                <strong>Dimensões:</strong> {produto.dimensoes}
              </li>
            )}
          </ul>

          <div className="product-actions">
            <a
              href={isReserved ? undefined : whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`product-whatsapp-cta ${isReserved ? 'is-disabled' : ''}`}
              aria-disabled={isReserved}
              onClick={(event) => {
                if (isReserved) {
                  event.preventDefault()
                }
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.05 4.94A9.94 9.94 0 0 0 12 2a10 10 0 0 0-8.66 15l-1.3 4.76 4.88-1.28A10 10 0 1 0 19.05 4.94ZM12 20.17a8.08 8.08 0 0 1-4.1-1.11l-.3-.18-2.9.76.78-2.82-.2-.3a8.17 8.17 0 1 1 6.72 3.65Zm4.49-6.14c-.25-.12-1.48-.73-1.71-.82-.23-.08-.4-.12-.56.12-.17.25-.65.82-.8.98-.15.17-.3.19-.56.06-.25-.13-1.08-.4-2.05-1.28-.75-.66-1.25-1.47-1.4-1.72-.15-.25-.02-.39.11-.52.12-.12.25-.3.37-.45.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.86-.2-.47-.4-.4-.56-.4h-.48c-.16 0-.43.06-.65.31-.23.25-.85.83-.85 2.03s.87 2.37 1 2.53c.12.16 1.68 2.56 4.08 3.6.57.25 1.02.4 1.37.51.57.18 1.1.16 1.52.1.46-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29Z" />
              </svg>
              Negociar por Whatsapp
            </a>

            <button type="button" className="product-share-button" onClick={handleShare}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
              </svg>
              {shareFeedback ? 'Link copiado!' : 'Compartilhar'}
            </button>
          </div>
        </article>
      </section>

      <section className="product-recommendations" aria-label="Outros itens disponíveis">
        <h2>Você também pode gostar</h2>

        {isRecommendationsLoading ? (
          <div className="recommendations-grid hide-scrollbar" role="status" aria-live="polite">
            {Array.from({ length: 4 }).map((_, index) => (
              <article key={`recommendation-skeleton-${index}`} className="product-card skeleton-card">
                <Skeleton className="skeleton-card__media" />
                <div className="skeleton-card__body">
                  <Skeleton className="skeleton-card__line skeleton-card__line--category" />
                  <Skeleton className="skeleton-card__line skeleton-card__line--title" />
                  <Skeleton className="skeleton-card__line skeleton-card__line--tag" />
                  <Skeleton className="skeleton-card__line skeleton-card__line--price" />
                </div>
              </article>
            ))}
          </div>
        ) : recommendedProducts.length > 0 ? (
          <div className="recommendations-grid hide-scrollbar">
            {recommendedProducts.map((item) => (
              <ProductCard key={item.id} {...item} />
            ))}
          </div>
        ) : (
          <p className="product-recommendations__empty">Sem recomendações no momento.</p>
        )}
      </section>

      {lightboxIndex !== null && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada da imagem"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={(event) => {
              event.stopPropagation()
              setLightboxIndex(null)
            }}
          >
            Fechar
          </button>

          {galleryImages.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-nav--prev"
              aria-label="Foto anterior"
              onClick={(event) => {
                event.stopPropagation()
                setLightboxIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length)
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" /></svg>
            </button>
          )}

          <img
            src={galleryImages[lightboxIndex]}
            alt={`Imagem ${lightboxIndex + 1} de ${produto.nome}`}
            className="lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />

          {galleryImages.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-nav--next"
              aria-label="Próxima foto"
              onClick={(event) => {
                event.stopPropagation()
                setLightboxIndex((i) => (i + 1) % galleryImages.length)
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" /></svg>
            </button>
          )}

          {galleryImages.length > 1 && (
            <span className="lightbox-counter" aria-live="polite">
              {lightboxIndex + 1} / {galleryImages.length}
            </span>
          )}
        </div>
      )}
    </main>
  )
}

export default ProductDetails
