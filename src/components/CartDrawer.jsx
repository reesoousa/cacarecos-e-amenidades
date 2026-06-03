import { useEffect, useRef, useState } from 'react'
import { useCart } from '../contexts/CartContext'

const WHATSAPP_NUMBER = '5511966751161'
const SWIPE_THRESHOLD = 100

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

function getPriceLabel(item) {
  const isDoacao = item.categoria?.toLowerCase().includes('doa')
  const hasPrice = typeof item.preco === 'number' && item.preco > 0
  if (isDoacao || !hasPrice) return 'Doação'
  return priceFormatter.format(item.preco)
}

export default function CartDrawer() {
  const { items, removeItem, clearCart, isOpen, closeCart } = useCart()
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartY = useRef(null)
  const isDragging = useRef(false)
  const drawerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closeCart() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeCart])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setDragOffset(0)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY
    isDragging.current = true
  }

  const handleTouchMove = (e) => {
    if (!isDragging.current || dragStartY.current === null) return
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta > 0) setDragOffset(delta)
  }

  const handleTouchEnd = () => {
    isDragging.current = false
    if (dragOffset > SWIPE_THRESHOLD) {
      closeCart()
    } else {
      setDragOffset(0)
    }
  }

  const total = items.reduce((sum, item) => {
    const isDoacao = item.categoria?.toLowerCase().includes('doa')
    const hasPrice = typeof item.preco === 'number' && item.preco > 0
    return sum + (isDoacao || !hasPrice ? 0 : item.preco)
  }, 0)

  const hasPricedItems = items.some((item) => {
    const isDoacao = item.categoria?.toLowerCase().includes('doa')
    return !isDoacao && typeof item.preco === 'number' && item.preco > 0
  })

  const handleWhatsApp = () => {
    const lines = items.map((item) => `• ${item.nome} — ${getPriceLabel(item)}`)
    const totalLine = hasPricedItems ? `\nTotal aproximado: ${priceFormatter.format(total)}` : ''
    const message = `Oi! Me interessei por alguns itens da lojinha:\n\n${lines.join('\n')}${totalLine}\n\nAinda estão disponíveis?`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const drawerStyle = {
    transform: isOpen ? `translateY(${dragOffset}px)` : 'translateY(100%)',
    transition: isDragging.current ? 'none' : 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`cart-backdrop ${isOpen ? 'is-visible' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="cart-drawer"
        style={drawerStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de interesse"
      >
        {/* Handle para swipe */}
        <div
          className="cart-drawer__handle-area"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="cart-drawer__handle" />
        </div>

        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">
            Minha lista
            <span className="cart-drawer__count">{items.length}</span>
          </h2>
          <div className="cart-drawer__header-actions">
            {items.length > 0 && (
              <button type="button" className="cart-drawer__clear" onClick={clearCart}>
                Limpar tudo
              </button>
            )}
            <button type="button" className="cart-drawer__close" onClick={closeCart} aria-label="Fechar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <p className="cart-drawer__empty">Nenhum item adicionado ainda.</p>
          ) : (
            <ul className="cart-drawer__list">
              {items.map((item) => {
                const cover = Array.isArray(item.fotos) && item.fotos.length > 0 ? item.fotos[0] : null
                return (
                  <li key={item.id} className="cart-drawer__item">
                    {cover && (
                      <img src={cover} alt={item.nome} className="cart-drawer__item-img" />
                    )}
                    <div className="cart-drawer__item-info">
                      <span className="cart-drawer__item-name">{item.nome}</span>
                      <span className="cart-drawer__item-price">{getPriceLabel(item)}</span>
                    </div>
                    <button
                      type="button"
                      className="cart-drawer__item-remove"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remover ${item.nome}`}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer__footer">
            {hasPricedItems && (
              <div className="cart-drawer__total">
                <span>Total aproximado</span>
                <strong>{priceFormatter.format(total)}</strong>
              </div>
            )}
            <button type="button" className="cart-drawer__cta" onClick={handleWhatsApp}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.05 4.94A9.94 9.94 0 0 0 12 2a10 10 0 0 0-8.66 15l-1.3 4.76 4.88-1.28A10 10 0 1 0 19.05 4.94ZM12 20.17a8.08 8.08 0 0 1-4.1-1.11l-.3-.18-2.9.76.78-2.82-.2-.3a8.17 8.17 0 1 1 6.72 3.65Zm4.49-6.14c-.25-.12-1.48-.73-1.71-.82-.23-.08-.4-.12-.56.12-.17.25-.65.82-.8.98-.15.17-.3.19-.56.06-.25-.13-1.08-.4-2.05-1.28-.75-.66-1.25-1.47-1.4-1.72-.15-.25-.02-.39.11-.52.12-.12.25-.3.37-.45.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.86-.2-.47-.4-.4-.56-.4h-.48c-.16 0-.43.06-.65.31-.23.25-.85.83-.85 2.03s.87 2.37 1 2.53c.12.16 1.68 2.56 4.08 3.6.57.25 1.02.4 1.37.51.57.18 1.1.16 1.52.1.46-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29Z" />
              </svg>
              Negociar tudo pelo WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  )
}
