const WHATSAPP_NUMBER = 'SEU_NUMERO'
const PRODUCT_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1488998527040-85054a85150e?auto=format&fit=crop&w=900&q=80'

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

function ProductCard({
  id,
  nome,
  descricao,
  preco,
  categoria,
  subcategoria,
  estado_uso,
  motivo_desapego,
  is_feito_a_mao,
  dimensoes,
  fotos,
  status,
}) {
  const normalizedCategoria = categoria?.toLowerCase()
  const normalizedStatus = status?.toLowerCase()
  const isDonation = normalizedCategoria === 'doação' || normalizedCategoria === 'doacao'
  const isReserved = normalizedStatus === 'reservado'
  const hasPrice = typeof preco === 'number' && preco > 0
  const priceText = isDonation || !hasPrice ? 'Doação' : priceFormatter.format(preco)
  const coverImage = Array.isArray(fotos) && fotos.length > 0 ? fotos[0] : PRODUCT_PLACEHOLDER_IMAGE

  const details = [subcategoria, estado_uso, dimensoes].filter(Boolean)

  const waText = encodeURIComponent(`Oi! Vi o item ${nome} no Cacarecos & Amenidades e tenho interesse.`)
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`

  return (
    <article className="product-card" aria-labelledby={`product-title-${id}`}>
      <div className="product-card__media">
        <img src={coverImage} alt={nome} className="product-card__image" loading="lazy" />
        <div className="product-card__badges" aria-label="Status do item">
          {isDonation && <span className="badge badge--donation">Doação</span>}
          {isReserved && <span className="badge badge--reserved">Reservado</span>}
          {is_feito_a_mao && <span className="badge badge--handmade">Peça Autoral / Feita à mão</span>}
        </div>
      </div>

      <div className="product-card__body">
        <p className="product-card__category">{categoria || 'Sem categoria'}</p>
        <h2 id={`product-title-${id}`} className="product-card__title">
          {nome}
        </h2>
        {descricao && <p className="product-card__description">{descricao}</p>}

        {details.length > 0 && (
          <ul className="product-card__meta" aria-label="Detalhes do produto">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}

        {motivo_desapego && <p className="product-card__reason">Motivo: {motivo_desapego}</p>}

        <div className="product-card__footer">
          <p className="product-card__price" aria-label={`Preço: ${priceText}`}>
            {priceText}
          </p>

          <a
            href={isReserved ? undefined : whatsappLink}
            className={`product-card__button ${isReserved ? 'is-disabled' : ''}`}
            target="_blank"
            rel="noreferrer"
            aria-disabled={isReserved}
            tabIndex={isReserved ? -1 : 0}
            onClick={(event) => {
              if (isReserved) {
                event.preventDefault()
              }
            }}
          >
            Tenho Interesse
          </a>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
