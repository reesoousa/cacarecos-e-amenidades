import { useEffect, useRef, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const INITIAL_FORM = {
  nome: '',
  descricao: '',
  preco: '',
  categoria: 'Venda',
  subcategoria: '',
  estado_uso: 'Bom estado',
  motivo_desapego: '',
  is_feito_a_mao: false,
  dimensoes: '',
}

const SUBCATEGORIAS = ['Móveis', 'Decoração', 'Eletrodomésticos', 'Eletrônicos', 'Utensílios', 'Outros']
const ESTADOS = ['Novo', 'Seminovo', 'Bom estado', 'Com avarias']
const TOTAL_STEPS = 4

function MobileProductWizard({ onClose, onSuccess }) {
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [images, setImages] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      images.forEach((img) => {
        if (img.preview?.startsWith('blob:')) URL.revokeObjectURL(img.preview)
      })
    }
  }, [])

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSelectImages = (event) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return
    const newItems = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
    }))
    setImages((prev) => [...prev, ...newItems])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveImage = (id) => {
    setImages((prev) => {
      const item = prev.find((img) => img.id === id)
      if (item?.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview)
      return prev.filter((img) => img.id !== id)
    })
  }

  const canAdvance = () => {
    if (step === 1) return images.length > 0
    if (step === 2) return formData.nome.trim() && formData.descricao.trim()
    if (step === 3) return formData.subcategoria !== ''
    return formData.motivo_desapego.trim() !== ''
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const finalUrls = []
      for (const item of images) {
        const ext = item.file.name.split('.').pop()
        const base = item.file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-')
        const path = `produtos/${Date.now()}-${base}.${ext}`
        const { error: uploadError } = await supabase.storage.from('fotos_produtos').upload(path, item.file, {
          cacheControl: '3600',
          upsert: false,
        })
        if (uploadError) throw new Error('Erro ao enviar imagem.')
        const { data: { publicUrl } } = supabase.storage.from('fotos_produtos').getPublicUrl(path)
        finalUrls.push(publicUrl)
      }

      const payload = {
        ...formData,
        preco: formData.preco === '' ? null : Number(formData.preco),
        fotos: finalUrls,
        status: 'Disponível',
      }

      const { data, error: insertError } = await supabase.from('produtos').insert(payload).select('*').single()
      if (insertError) throw new Error('Erro ao salvar produto.')

      onSuccess(data)
      onClose()
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true" aria-label="Cadastro rápido de produto">
      <div className="wizard-shell">
        {/* Header */}
        <div className="wizard-header">
          <button
            type="button"
            className="wizard-header__back"
            onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
            aria-label={step === 1 ? 'Fechar' : 'Voltar'}
          >
            {step === 1 ? '✕' : '←'}
          </button>
          <div className="wizard-progress">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`wizard-progress__dot ${i + 1 <= step ? 'is-active' : ''}`} />
            ))}
          </div>
          <span className="wizard-header__step">{step}/{TOTAL_STEPS}</span>
        </div>

        {/* Steps */}
        <div className="wizard-body">
          {step === 1 && (
            <div className="wizard-step">
              <h2 className="wizard-step__title">Fotos do produto</h2>
              <p className="wizard-step__hint">A primeira foto será a capa. Tire direto pela câmera ou escolha da galeria.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleSelectImages}
                className="admin-file-input-hidden"
              />

              <button type="button" className="wizard-photo-btn" onClick={() => fileInputRef.current?.click()}>
                <span className="wizard-photo-btn__icon">📷</span>
                <span>{images.length === 0 ? 'Tirar ou escolher fotos' : 'Adicionar mais fotos'}</span>
              </button>

              {images.length > 0 && (
                <div className="wizard-photo-grid">
                  {images.map((img, idx) => (
                    <div key={img.id} className={`wizard-photo-thumb ${idx === 0 ? 'is-cover' : ''}`}>
                      {idx === 0 && <span className="admin-image-preview__badge">Capa</span>}
                      <img src={img.preview} alt={`Foto ${idx + 1}`} />
                      <button type="button" className="wizard-photo-thumb__remove" onClick={() => handleRemoveImage(img.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <h2 className="wizard-step__title">Nome e descrição</h2>

              <div className="wizard-field">
                <label className="wizard-field__label" htmlFor="w-nome">Nome do item</label>
                <input
                  id="w-nome"
                  className="wizard-field__input"
                  value={formData.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  placeholder="Ex: Cadeira de escritório preta"
                  autoFocus
                />
              </div>

              <div className="wizard-field">
                <label className="wizard-field__label" htmlFor="w-descricao">Descrição</label>
                <textarea
                  id="w-descricao"
                  className="wizard-field__input wizard-field__input--textarea"
                  value={formData.descricao}
                  onChange={(e) => set('descricao', e.target.value)}
                  placeholder="Descreva o estado, tamanho, cor, etc."
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <h2 className="wizard-step__title">Tipo e categoria</h2>

              <div className="wizard-field">
                <p className="wizard-field__label">Tipo</p>
                <div className="wizard-chip-group">
                  {['Venda', 'Doação'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`wizard-chip wizard-chip--large ${formData.categoria === cat ? 'is-selected' : ''}`}
                      onClick={() => set('categoria', cat)}
                    >
                      {cat === 'Venda' ? '🏷️ Venda' : '🎁 Doação'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wizard-field">
                <p className="wizard-field__label">Subcategoria</p>
                <div className="wizard-chip-group wizard-chip-group--wrap">
                  {SUBCATEGORIAS.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      className={`wizard-chip ${formData.subcategoria === sub ? 'is-selected' : ''}`}
                      onClick={() => set('subcategoria', sub)}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wizard-field">
                <p className="wizard-field__label">Estado de uso</p>
                <div className="wizard-chip-group wizard-chip-group--wrap">
                  {ESTADOS.map((estado) => (
                    <button
                      key={estado}
                      type="button"
                      className={`wizard-chip ${formData.estado_uso === estado ? 'is-selected' : ''}`}
                      onClick={() => set('estado_uso', estado)}
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wizard-step">
              <h2 className="wizard-step__title">Detalhes finais</h2>

              {formData.categoria === 'Venda' && (
                <div className="wizard-field">
                  <label className="wizard-field__label" htmlFor="w-preco">Preço (R$)</label>
                  <input
                    id="w-preco"
                    type="number"
                    min="0"
                    step="0.01"
                    className="wizard-field__input"
                    value={formData.preco}
                    onChange={(e) => set('preco', e.target.value)}
                    placeholder="0,00 — deixe vazio para doação"
                  />
                </div>
              )}

              <div className="wizard-field">
                <label className="wizard-field__label" htmlFor="w-motivo">Motivo do desapego</label>
                <input
                  id="w-motivo"
                  className="wizard-field__input"
                  value={formData.motivo_desapego}
                  onChange={(e) => set('motivo_desapego', e.target.value)}
                  placeholder="Ex: Mudança, não uso mais, upgrade..."
                />
              </div>

              <div className="wizard-field">
                <label className="wizard-field__label" htmlFor="w-dimensoes">Dimensões <span className="wizard-field__optional">(opcional)</span></label>
                <input
                  id="w-dimensoes"
                  className="wizard-field__input"
                  value={formData.dimensoes}
                  onChange={(e) => set('dimensoes', e.target.value)}
                  placeholder="Ex: 60cm x 80cm x 120cm"
                />
              </div>

              <label className="wizard-toggle">
                <input
                  type="checkbox"
                  checked={formData.is_feito_a_mao}
                  onChange={(e) => set('is_feito_a_mao', e.target.checked)}
                />
                <span className="wizard-toggle__track" />
                <span className="wizard-toggle__label">Produto feito à mão (Ateliê)</span>
              </label>

              {error && <p className="wizard-error">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="wizard-footer">
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              className="wizard-footer__btn"
              disabled={!canAdvance()}
              onClick={() => setStep((s) => s + 1)}
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              className="wizard-footer__btn"
              disabled={isSubmitting || !canAdvance()}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar produto'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MobileProductWizard
