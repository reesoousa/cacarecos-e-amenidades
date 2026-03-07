const WHATSAPP_NUMBER = 'SEU_NUMERO'

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

function ProductCard({ id, nome, descricao, categoria, preco, imagemUrl, status }) {
  const isDonation = categoria?.toLowerCase() === 'doação'
  const isReserved = status?.toLowerCase() === 'reservado'

  const waText = encodeURIComponent(
    `Oi! Vi o item ${nome} no Cacarecos & Amenidades e tenho interesse.`
  )
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`

  const hasPrice = typeof preco === 'number' && preco > 0
  const priceText = isDonation || !hasPrice ? 'Doação' : priceFormatter.format(preco)

  return (
    <article className="product-card" aria-labelledby={`product-title-${id}`}>
      <div className="product-card__media">
        <img src={imagemUrl} alt={nome} className="product-card__image" loading="lazy" />
        <div className="product-card__badges" aria-label="Status do item">
          {isDonation && <span className="badge badge--donation">Doação</span>}
          {isReserved && <span className="badge badge--reserved">Reservado</span>}
        </div>
      </div>

      <div className="product-card__body">
        <p className="product-card__category">{categoria}</p>
        <h2 id={`product-title-${id}`} className="product-card__title">
          {nome}
        </h2>
        <p className="product-card__description">{descricao}</p>

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
