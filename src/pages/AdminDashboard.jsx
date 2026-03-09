import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Skeleton from '../components/Skeleton'
import { supabase } from '../services/supabaseClient'
import '../styles/admin.css'

const PRODUCT_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1488998527040-85054a85150e?auto=format&fit=crop&w=420&q=80'

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

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

function AdminDashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [produtos, setProdutos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [selectedImages, setSelectedImages] = useState([])
  const [editingProductId, setEditingProductId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionMessageType, setActionMessageType] = useState('success')
  const [draggedIndex, setDraggedIndex] = useState(null)

  const fetchProdutos = async () => {
    setIsLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })

    if (fetchError) {
      setError('Erro ao carregar produtos. Tente novamente em instantes.')
      setProdutos([])
    } else {
      setProdutos(data ?? [])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchProdutos()
  }, [])

  useEffect(() => {
    if (!actionMessage) {
      return undefined
    }

    const timeout = setTimeout(() => {
      setActionMessage('')
    }, 3800)

    return () => clearTimeout(timeout)
  }, [actionMessage])

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => {
        if (image.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(image.preview)
        }
      })
    }
  }, [selectedImages])

  const hasNewImages = useMemo(() => selectedImages.some((image) => image.type === 'file'), [selectedImages])

  const setFeedback = (message, type = 'success') => {
    setActionMessage(message)
    setActionMessageType(type)
  }

  const resetForm = () => {
    setFormData(INITIAL_FORM)
    setSelectedImages([])
    setDraggedIndex(null)
    setEditingProductId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleEditProduct = (product) => {
    setEditingProductId(product.id)
    setSelectedImages(
      (product.fotos ?? []).map((url, index) => ({
        id: `existing-${product.id}-${index}`,
        type: 'existing',
        preview: url,
        url,
      }))
    )
    setFormData({
      nome: product.nome ?? '',
      descricao: product.descricao ?? '',
      preco: product.preco ?? '',
      categoria: product.categoria ?? 'Venda',
      subcategoria: product.subcategoria ?? '',
      estado_uso: product.estado_uso ?? 'Bom estado',
      motivo_desapego: product.motivo_desapego ?? '',
      is_feito_a_mao: Boolean(product.is_feito_a_mao),
      dimensoes: product.dimensoes ?? '',
    })
    setFeedback(`Editando produto: ${product.nome}`)
  }

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status?.toLowerCase() === 'reservado' ? 'Disponível' : 'Reservado'
    setActionLoadingId(product.id)

    const { error: updateError } = await supabase.from('produtos').update({ status: nextStatus }).eq('id', product.id)

    if (updateError) {
      setFeedback('Não foi possível atualizar o status do produto.', 'error')
    } else {
      setProdutos((prev) => prev.map((item) => (item.id === product.id ? { ...item, status: nextStatus } : item)))
      setFeedback(`Status de "${product.nome}" atualizado para ${nextStatus}.`)
    }

    setActionLoadingId(null)
  }

  const handleDelete = async (productId) => {
    setActionLoadingId(productId)

    const { error: deleteError } = await supabase.from('produtos').delete().eq('id', productId)

    if (deleteError) {
      setFeedback('Não foi possível excluir o produto.', 'error')
    } else {
      setProdutos((prev) => prev.filter((item) => item.id !== productId))
      if (editingProductId === productId) {
        resetForm()
      }
      setFeedback('Produto excluído com sucesso.')
    }

    setActionLoadingId(null)
  }

  const handleSelectImages = (event) => {
    const files = Array.from(event.target.files ?? [])

    if (!files.length) {
      return
    }

    const newImageItems = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'file',
      file,
      preview: URL.createObjectURL(file),
    }))

    setSelectedImages((prev) => [...prev, ...newImageItems])

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleMoveImage = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex == null || toIndex == null || toIndex < 0) {
      return
    }

    setSelectedImages((prev) => {
      if (toIndex >= prev.length) {
        return prev
      }

      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const handleRemoveImage = (imageId) => {
    setSelectedImages((prev) => {
      const imageToRemove = prev.find((image) => image.id === imageId)
      if (imageToRemove?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.preview)
      }

      return prev.filter((image) => image.id !== imageId)
    })
  }

  const uploadImages = async () => {
    if (!selectedImages.length) {
      return null
    }

    const finalUrls = []

    for (const imageItem of selectedImages) {
      if (imageItem.type === 'existing') {
        finalUrls.push(imageItem.url)
        continue
      }

      const imageFile = imageItem.file
      const extension = imageFile.name.split('.').pop()
      const safeBaseName = imageFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-')
      const filePath = `produtos/${Date.now()}-${safeBaseName}.${extension}`

      const { error: uploadError } = await supabase.storage.from('fotos_produtos').upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
      })

      if (uploadError) {
        throw new Error('Erro ao enviar uma das imagens. Verifique os arquivos e tente novamente.')
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('fotos_produtos').getPublicUrl(filePath)

      finalUrls.push(publicUrl)
    }

    return finalUrls
  }

  const handleSubmitProduct = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setActionMessage('')

    try {
      const uploadedUrls = await uploadImages()

      if (!editingProductId && !uploadedUrls?.length) {
        setFeedback('Selecione ao menos uma imagem para cadastrar o produto.', 'error')
        setIsSubmitting(false)
        return
      }

      const payload = {
        ...formData,
        preco: formData.preco === '' ? null : Number(formData.preco),
      }

      if (uploadedUrls?.length) {
        payload.fotos = uploadedUrls
      }

      if (editingProductId) {
        const { data: updatedProduct, error: updateError } = await supabase
          .from('produtos')
          .update(payload)
          .eq('id', editingProductId)
          .select('*')
          .single()

        if (updateError) {
          setFeedback('Não foi possível atualizar o produto.', 'error')
          setIsSubmitting(false)
          return
        }

        setProdutos((prev) => prev.map((item) => (item.id === editingProductId ? updatedProduct : item)))
        setFeedback('Produto atualizado com sucesso.')
        resetForm()
        setIsSubmitting(false)
        return
      }

      payload.status = 'Disponível'

      const { data: insertedProduct, error: insertError } = await supabase.from('produtos').insert(payload).select('*').single()

      if (insertError) {
        setFeedback('Produto salvo parcialmente: imagens enviadas, mas ocorreu erro ao inserir no banco.', 'error')
        setIsSubmitting(false)
        return
      }

      setProdutos((prev) => [insertedProduct, ...prev])
      resetForm()
      setFeedback('Produto cadastrado com sucesso.')
    } catch (uploadError) {
      setFeedback(uploadError.message, 'error')
    }

    setIsSubmitting(false)
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-header__eyebrow">Cacarecos & Amenidades</p>
          <h1>Painel de Controle</h1>
        </div>
        <button type="button" onClick={handleLogout} className="admin-ghost-button">
          Sair
        </button>
      </header>

      {actionMessage && (
        <p className={`admin-feedback ${actionMessageType === 'error' ? 'admin-feedback--error' : 'admin-feedback--success'}`}>
          {actionMessage}
        </p>
      )}
      {error && <p className="admin-feedback admin-feedback--error">{error}</p>}

      <section className="admin-layout" aria-label="Gestão de produtos">
        <article className="admin-panel">
          <h2>Produtos cadastrados</h2>

          {isLoading ? (
            <ul className="admin-product-list" role="status" aria-live="polite" aria-label="Carregando produtos">
              {Array.from({ length: 4 }).map((_, index) => (
                <li key={`admin-skeleton-${index}`} className="admin-product-card admin-product-card--skeleton">
                  <Skeleton className="admin-skeleton__image" />
                  <div className="admin-product-card__info">
                    <Skeleton className="admin-skeleton__line admin-skeleton__line--title" />
                    <Skeleton className="admin-skeleton__line admin-skeleton__line--price" />
                    <Skeleton className="admin-skeleton__badge" />
                  </div>
                  <div className="admin-product-card__actions">
                    <Skeleton className="admin-skeleton__button" />
                    <Skeleton className="admin-skeleton__button" />
                    <Skeleton className="admin-skeleton__button" />
                  </div>
                </li>
              ))}
            </ul>
          ) : produtos.length === 0 ? (
            <p className="admin-panel__placeholder">Nenhum produto cadastrado ainda.</p>
          ) : (
            <ul className="admin-product-list">
              {produtos.map((product) => {
                const coverImage = Array.isArray(product.fotos) && product.fotos.length > 0 ? product.fotos[0] : PRODUCT_PLACEHOLDER_IMAGE
                const isReserved = product.status?.toLowerCase() === 'reservado'
                const isActionLoading = actionLoadingId === product.id

                return (
                  <li key={product.id} className="admin-product-card">
                    <img src={coverImage} alt={product.nome} />
                    <div className="admin-product-card__info">
                      <h3>{product.nome}</h3>
                      <p>{typeof product.preco === 'number' ? priceFormatter.format(product.preco) : 'Doação'}</p>
                      <span className={`admin-status ${isReserved ? 'is-reserved' : 'is-available'}`}>
                        {isReserved ? 'Reservado' : 'Disponível'}
                      </span>
                    </div>

                    <div className="admin-product-card__actions">
                      <button type="button" onClick={() => handleEditProduct(product)} disabled={isActionLoading}>
                        Editar
                      </button>
                      <button type="button" onClick={() => handleToggleStatus(product)} disabled={isActionLoading}>
                        {isReserved ? 'Marcar como Disponível' : 'Marcar como Reservado'}
                      </button>
                      <button
                        type="button"
                        className="admin-danger-button"
                        onClick={() => handleDelete(product.id)}
                        disabled={isActionLoading}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </article>

        <article className="admin-panel">
          <h2>{editingProductId ? 'Editar Produto' : 'Novo Produto'}</h2>

          <form className="admin-form" onSubmit={handleSubmitProduct}>
            <label htmlFor="nome">Nome</label>
            <input id="nome" name="nome" value={formData.nome} onChange={handleFormChange} required />

            <label htmlFor="descricao">Descrição</label>
            <textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleFormChange} rows={3} required />

            <label htmlFor="preco">Preço</label>
            <input id="preco" name="preco" type="number" min="0" step="0.01" value={formData.preco} onChange={handleFormChange} />

            <label htmlFor="categoria">Categoria</label>
            <select id="categoria" name="categoria" value={formData.categoria} onChange={handleFormChange}>
              <option value="Venda">Venda</option>
              <option value="Doação">Doação</option>
            </select>

            <label htmlFor="subcategoria">Subcategoria</label>
            <select id="subcategoria" name="subcategoria" value={formData.subcategoria} onChange={handleFormChange} required>
              <option value="">Selecione</option>
              <option value="Móveis">Móveis</option>
              <option value="Decoração">Decoração</option>
              <option value="Eletrodomésticos">Eletrodomésticos</option>
              <option value="Eletrônicos">Eletrônicos</option>
              <option value="Utensílios">Utensílios</option>
              <option value="Outros">Outros</option>
            </select>

            <label htmlFor="estado_uso">Estado de uso</label>
            <select id="estado_uso" name="estado_uso" value={formData.estado_uso} onChange={handleFormChange}>
              <option value="Novo">Novo</option>
              <option value="Seminovo">Seminovo</option>
              <option value="Bom estado">Bom estado</option>
              <option value="Com avarias">Com avarias</option>
            </select>

            <label htmlFor="motivo_desapego">Motivo do desapego</label>
            <input
              id="motivo_desapego"
              name="motivo_desapego"
              value={formData.motivo_desapego}
              onChange={handleFormChange}
              required
            />

            <label htmlFor="dimensoes">Dimensões</label>
            <input id="dimensoes" name="dimensoes" value={formData.dimensoes} onChange={handleFormChange} />

            <div className="admin-image-upload">
              <p className="admin-image-upload__label">Fotos do produto</p>
              <input
                id="imagem"
                ref={fileInputRef}
                name="imagem"
                type="file"
                accept="image/*"
                multiple
                onChange={handleSelectImages}
                required={!editingProductId && selectedImages.length === 0}
                className="admin-file-input-hidden"
              />
              <button type="button" className="admin-upload-button" onClick={() => fileInputRef.current?.click()}>
                Adicionar Fotos
              </button>
              <p className="admin-image-upload__hint">
                Arraste para reordenar. A primeira imagem será usada como capa na vitrine.
              </p>

              {selectedImages.length > 0 && (
                <div className="admin-image-preview-grid" aria-label="Pré-visualização das fotos">
                  {selectedImages.map((image, index) => (
                    <div
                      key={image.id}
                      className={`admin-image-preview ${index === 0 ? 'is-cover' : ''} ${draggedIndex === index ? 'is-dragging' : ''}`}
                      draggable
                      onDragStart={() => setDraggedIndex(index)}
                      onDragEnter={() => handleMoveImage(draggedIndex, index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDragEnd={() => setDraggedIndex(null)}
                    >
                      {index === 0 && <span className="admin-image-preview__badge">Capa</span>}
                      <img src={image.preview} alt={`Prévia da imagem ${index + 1}`} />
                      <button type="button" onClick={() => handleRemoveImage(image.id)} className="admin-image-preview__remove">
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="admin-checkbox" htmlFor="is_feito_a_mao">
              <input
                id="is_feito_a_mao"
                name="is_feito_a_mao"
                type="checkbox"
                checked={formData.is_feito_a_mao}
                onChange={handleFormChange}
              />
              Produto feito à mão
            </label>

            <button type="submit" disabled={isSubmitting || (!editingProductId && !hasNewImages && selectedImages.length === 0)}>
              {isSubmitting
                ? editingProductId
                  ? 'Atualizando produto...'
                  : 'Salvando produto...'
                : editingProductId
                  ? 'Atualizar produto'
                  : 'Salvar produto'}
            </button>

            {editingProductId && (
              <button type="button" className="admin-ghost-button" onClick={resetForm}>
                Cancelar edição
              </button>
            )}
          </form>
        </article>
      </section>
    </main>
  )
}

export default AdminDashboard
