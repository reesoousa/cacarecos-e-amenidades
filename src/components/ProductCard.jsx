import { Link } from 'react-router-dom'

const WHATSAPP_NUMBER = 'SEU_NUMERO'
const PRODUCT_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1488998527040-85054a85150e?auto=format&fit=crop&w=900&q=80'

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

function ProductCard({ id, nome, preco, categoria, subcategoria, estado_uso, is_feito_a_mao, dimensoes, fotos, status }) {
  const normalizedCategoria = categoria?.toLowerCase()
  const normalizedStatus = status?.toLowerCase()
  const isDonation = normalizedCategoria === 'doação' || normalizedCategoria === 'doacao'
  const isReserved = normalizedStatus === 'reservado'
  const hasPrice = typeof preco === 'number' && preco > 0
  const priceText = isDonation || !hasPrice ? 'Doação' : priceFormatter.format(preco)
  const coverImage = Array.isArray(fotos) && fotos.length > 0 ? fotos[0] : PRODUCT_PLACEHOLDER_IMAGE

  const details = [subcategoria, estado_uso, dimensoes].filter(Boolean)
  const waText = encodeURIComponent(`Oi! Vi o item ${nome} e quero reservar.`)
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`

  return (
    <article className="product-card" aria-labelledby={`product-title-${id}`}>
      <Link to={`/produto/${id}`} className="product-card__link-wrapper" aria-label={`Ver detalhes de ${nome}`}>
        <div className="product-card__media">
          <img src={coverImage} alt={nome} className="product-card__image" loading="lazy" />
          <div className="product-card__badges" aria-label="Status do item">
            {isDonation && <span className="badge badge--donation">Doação</span>}
            {isReserved && <span className="badge badge--reserved">Reservado</span>}
            {is_feito_a_mao && <span className="badge badge--handmade">Peça Autoral</span>}
          </div>
        </div>

        <div className="product-card__body">
          <p className="product-card__category">{categoria || 'Sem categoria'}</p>
          <h2 id={`product-title-${id}`} className="product-card__title">
            {nome}
          </h2>

          {details.length > 0 && (
            <ul className="product-card__meta" aria-label="Detalhes do produto">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}

          <div className="product-card__footer">
            <p className="product-card__price" aria-label={`Preço: ${priceText}`}>
              {priceText}
            </p>
            <span className="product-card__button">Ver detalhes</span>
          </div>
        </div>
      </Link>

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
  )
}

export default ProductCard
