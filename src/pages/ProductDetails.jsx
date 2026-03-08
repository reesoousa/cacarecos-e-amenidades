import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

function ProductDetails() {
  const { id } = useParams()
  const [produto, setProduto] = useState(null)
  const [mainImage, setMainImage] = useState(PRODUCT_PLACEHOLDER_IMAGE)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

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
        if (Array.isArray(data.fotos) && data.fotos.length > 0) {
          setMainImage(data.fotos[0])
        } else {
          setMainImage(PRODUCT_PLACEHOLDER_IMAGE)
        }
      }

      setIsLoading(false)
    }

    fetchProduct()
  }, [id])

  const galleryImages = useMemo(() => {
    if (!produto || !Array.isArray(produto.fotos) || produto.fotos.length === 0) {
      return [PRODUCT_PLACEHOLDER_IMAGE]
    }

    return produto.fotos
  }, [produto])

  if (isLoading) {
    return (
      <main className="home-page">
        <section className="home-feedback" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Carregando detalhes do produto...</p>
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
          <img src={mainImage} alt={produto.nome} className="product-gallery__main" />

          {galleryImages.length > 1 && (
            <div className="product-gallery__thumbs" aria-label="Galeria de fotos">
              {galleryImages.map((image) => (
                <button
                  key={image}
                  type="button"
                  className={`product-gallery__thumb ${mainImage === image ? 'is-active' : ''}`}
                  onClick={() => setMainImage(image)}
                >
                  <img src={image} alt={`Foto de ${produto.nome}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <article className="product-info">
          <p className="product-info__category">{produto.categoria || 'Sem categoria'}</p>
          <h1>{produto.nome}</h1>
          <p className="product-info__price">{priceText}</p>

          <div className="product-info__badges">
            {produto.status?.toLowerCase() === 'reservado' && <span className="badge badge--reserved">Reservado</span>}
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
            href={produto.status?.toLowerCase() === 'reservado' ? undefined : whatsappLink}
            target="_blank"
            rel="noreferrer"
            className={`product-sticky-cta ${produto.status?.toLowerCase() === 'reservado' ? 'is-disabled' : ''}`}
            aria-disabled={produto.status?.toLowerCase() === 'reservado'}
            onClick={(event) => {
              if (produto.status?.toLowerCase() === 'reservado') {
                event.preventDefault()
              }
            }}
          >
            Reservar via WhatsApp
          </a>
        </article>
      </section>
    </main>
  )
}

export default ProductDetails
