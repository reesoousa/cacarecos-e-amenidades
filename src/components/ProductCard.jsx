import { Link } from 'react-router-dom'

const PRODUCT_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1488998527040-85054a85150e?auto=format&fit=crop&w=900&q=80'

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

function ProductCard({ id, nome, preco, categoria, estado_uso, is_feito_a_mao, fotos, status }) {
  const normalizedCategoria = normalizeText(categoria)
  const normalizedStatus = status?.toLowerCase()
  const isDonation = normalizedCategoria.includes('doacao')
  const isSale = normalizedCategoria.includes('venda')
  const isReserved = normalizedStatus === 'reservado'
  const hasPrice = typeof preco === 'number' && preco > 0
  const priceText = isDonation || !hasPrice ? 'Doação' : priceFormatter.format(preco)
  const coverImage = Array.isArray(fotos) && fotos.length > 0 ? fotos[0] : PRODUCT_PLACEHOLDER_IMAGE

  return (
    <article
      className={`product-card transition-all duration-500 ease-out ${is_feito_a_mao ? 'is-handmade' : ''}`}
      aria-labelledby={`product-title-${id}`}
    >
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
          <h2 id={`product-title-${id}`} className="product-card__title">
            {nome}
          </h2>

          <div className="product-card__info-tags" aria-label="Categoria e estado de uso">
            <span className={`product-card__tag ${isDonation ? 'is-donation' : isSale ? 'is-sale' : 'is-default'}`}>
              {categoria || 'Categoria não informada'}
            </span>
            <span className="product-card__tag is-usage">{estado_uso || 'Estado não informado'}</span>
          </div>

          <p className="product-card__price" aria-label={`Preço: ${priceText}`}>
            {priceText}
          </p>
        </div>
      </Link>
    </article>
  )
}

export default ProductCard
