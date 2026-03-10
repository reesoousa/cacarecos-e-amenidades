import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Skeleton from '../components/Skeleton'
import { supabase } from '../services/supabaseClient'
import '../styles/home.css'

const WHATSAPP_NUMBER = 'SEU_NUMERO'
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
  const [lightboxImage, setLightboxImage] = useState(null)
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

  useEffect(() => {
    if (!lightboxImage) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setLightboxImage(null)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [lightboxImage])

  const galleryImages = useMemo(() => {
    if (!produto || !Array.isArray(produto.fotos) || produto.fotos.length === 0) {
      return [PRODUCT_PLACEHOLDER_IMAGE]
    }

    return produto.fotos
  }, [produto])

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
  const waText = encodeURIComponent(`Oi! Vi o item ${produto.nome} e quero reservar.`)
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`

  return (
    <main className="home-page product-page">
      <Link className="product-back-link" to="/">
        ← Voltar para os itens
      </Link>

      <section className="product-layout" aria-label="Detalhes do produto">
        <div className="product-gallery">
          <div className="product-gallery-mobile hide-scrollbar" aria-label="Galeria mobile">
            {galleryImages.map((image, index) => (
              <button key={`${image}-${index}`} type="button" className="product-gallery-mobile__item" onClick={() => setLightboxImage(image)}>
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
              <button type="button" className="product-gallery-desktop__single overflow-hidden" onClick={() => setLightboxImage(featuredImage)}>
                <img src={featuredImage} alt={`Foto 1 de ${produto.nome}`} loading="lazy" className="w-full h-full object-cover" />
              </button>
            ) : (
              <>
                <button type="button" className="product-gallery-desktop__featured overflow-hidden" onClick={() => setLightboxImage(featuredImage)}>
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
                        onClick={() => setLightboxImage(image)}
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

          <a
            href={isReserved ? undefined : whatsappLink}
            target="_blank"
            rel="noreferrer"
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
            Reservar via WhatsApp
          </a>
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

      {lightboxImage && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada da imagem"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={(event) => {
              event.stopPropagation()
              setLightboxImage(null)
            }}
          >
            Fechar
          </button>
          <img
            src={lightboxImage}
            alt={`Imagem ampliada de ${produto.nome}`}
            className="lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  )
}

export default ProductDetails
