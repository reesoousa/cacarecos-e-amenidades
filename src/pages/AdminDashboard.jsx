import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Skeleton from '../components/Skeleton'
import { supabase } from '../services/supabaseClient'
import '../styles/admin.css'
import logoWhiteRetangular from '../visual-id/logo-cacarecos-white-retangular.svg'
import logoWhiteLine from '../visual-id/logo-cacarecos-white-line.svg'

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

const BANNER_CONFIG = {
  desktop: {
    key: 'desktop',
    label: 'Banner Desktop',
    helperText: 'Tamanho recomendado: 1200x300px (4:1)',
    fileName: 'banner_home_desktop',
  },
  mobile: {
    key: 'mobile',
    label: 'Banner Mobile',
    helperText: 'Tamanho recomendado: 800x800px (1:1)',
    fileName: 'banner_home_mobile',
  },
}

const STATUS_FILTERS = [
  { key: 'disponivel', label: 'Disponível' },
  { key: 'reservado', label: 'Reservado' },
]

const CATEGORY_FILTERS = [
  { key: 'venda', label: 'Venda' },
  { key: 'doacao', label: 'Doação' },
  { key: 'amao', label: 'Feito à mão' },
]

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
  const [bannerImages, setBannerImages] = useState({
    desktop: { file: null, preview: '', existingUrl: '' },
    mobile: { file: null, preview: '', existingUrl: '' },
  })
  const [bannerUploadLoading, setBannerUploadLoading] = useState({ desktop: false, mobile: false })
  const [activeTab, setActiveTab] = useState('produtos')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const getBannerPublicUrl = (fileName) => {
    const {
      data: { publicUrl },
    } = supabase.storage.from('fotos_produtos').getPublicUrl(`banners/${fileName}`)
    return publicUrl
  }

  const withCacheBusting = (url) => `${url}?t=${Date.now()}`

  const fetchBannerImages = async () => {
    const { data, error: listError } = await supabase.storage.from('fotos_produtos').list('banners', { limit: 50 })
    if (listError) return

    const availableFileNames = new Set((data ?? []).map((item) => item.name))
    setBannerImages((prev) => ({
      desktop: {
        ...prev.desktop,
        existingUrl: availableFileNames.has(BANNER_CONFIG.desktop.fileName)
          ? withCacheBusting(getBannerPublicUrl(BANNER_CONFIG.desktop.fileName))
          : '',
      },
      mobile: {
        ...prev.mobile,
        existingUrl: availableFileNames.has(BANNER_CONFIG.mobile.fileName)
          ? withCacheBusting(getBannerPublicUrl(BANNER_CONFIG.mobile.fileName))
          : '',
      },
    }))
  }

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
    fetchBannerImages()
  }, [])

  useEffect(() => {
    if (!actionMessage) return undefined
    const timeout = setTimeout(() => setActionMessage(''), 3800)
    return () => clearTimeout(timeout)
  }, [actionMessage])

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => {
        if (image.preview?.startsWith('blob:')) URL.revokeObjectURL(image.preview)
      })
    }
  }, [selectedImages])

  useEffect(() => {
    if (!deleteConfirmId) return undefined
    const timer = setTimeout(() => setDeleteConfirmId(null), 3000)
    return () => clearTimeout(timer)
  }, [deleteConfirmId])

  const hasNewImages = useMemo(() => selectedImages.some((image) => image.type === 'file'), [selectedImages])

  const stats = useMemo(() => {
    if (isLoading) return null
    const reservados = produtos.filter((p) => p.status?.toLowerCase() === 'reservado').length
    return {
      total: produtos.length,
      disponiveis: produtos.length - reservados,
      reservados,
      aMao: produtos.filter((p) => p.is_feito_a_mao).length,
    }
  }, [produtos, isLoading])

  const filteredProdutos = useMemo(() => {
    return produtos.filter((product) => {
      if (searchQuery && !product.nome?.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (statusFilter === 'disponivel' && product.status?.toLowerCase() === 'reservado') return false
      if (statusFilter === 'reservado' && product.status?.toLowerCase() !== 'reservado') return false
      if (categoryFilter === 'venda' && product.categoria?.toLowerCase() !== 'venda') return false
      if (categoryFilter === 'doacao' && !product.categoria?.toLowerCase().includes('doa')) return false
      if (categoryFilter === 'amao' && !product.is_feito_a_mao) return false
      return true
    })
  }, [produtos, searchQuery, statusFilter, categoryFilter])

  const setFeedback = (message, type = 'success') => {
    setActionMessage(message)
    setActionMessageType(type)
  }

  const resetForm = () => {
    setFormData(INITIAL_FORM)
    setSelectedImages([])
    setDraggedIndex(null)
    setEditingProductId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
    setActiveTab('formulario')
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

  const handleCancelEdit = () => {
    resetForm()
    setActiveTab('produtos')
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
    if (deleteConfirmId !== productId) {
      setDeleteConfirmId(productId)
      return
    }
    setDeleteConfirmId(null)
    setActionLoadingId(productId)
    const { error: deleteError } = await supabase.from('produtos').delete().eq('id', productId)
    if (deleteError) {
      setFeedback('Não foi possível excluir o produto.', 'error')
    } else {
      setProdutos((prev) => prev.filter((item) => item.id !== productId))
      if (editingProductId === productId) resetForm()
      setFeedback('Produto excluído com sucesso.')
    }
    setActionLoadingId(null)
  }

  const handleSelectImages = (event) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return
    const newImageItems = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'file',
      file,
      preview: URL.createObjectURL(file),
    }))
    setSelectedImages((prev) => [...prev, ...newImageItems])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleMoveImage = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex == null || toIndex == null || toIndex < 0) return
    setSelectedImages((prev) => {
      if (toIndex >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const handleRemoveImage = (imageId) => {
    setSelectedImages((prev) => {
      const imageToRemove = prev.find((image) => image.id === imageId)
      if (imageToRemove?.preview?.startsWith('blob:')) URL.revokeObjectURL(imageToRemove.preview)
      return prev.filter((image) => image.id !== imageId)
    })
  }

  const handleSelectBanner = (bannerKey, fileList) => {
    const [file] = Array.from(fileList ?? [])
    if (!file) return
    setBannerImages((prev) => {
      if (prev[bannerKey]?.preview?.startsWith('blob:')) URL.revokeObjectURL(prev[bannerKey].preview)
      return {
        ...prev,
        [bannerKey]: { ...prev[bannerKey], file, preview: URL.createObjectURL(file) },
      }
    })
  }

  const handleUploadBanner = async (bannerKey) => {
    const selectedFile = bannerImages[bannerKey]?.file
    if (!selectedFile) {
      setFeedback('Selecione uma imagem antes de salvar o banner.', 'error')
      return
    }
    setBannerUploadLoading((prev) => ({ ...prev, [bannerKey]: true }))
    const targetFileName = BANNER_CONFIG[bannerKey].fileName
    const bannerPath = `banners/${targetFileName}`
    let { error: uploadError } = await supabase.storage.from('fotos_produtos').upload(bannerPath, selectedFile, {
      cacheControl: '3600',
      upsert: true,
      contentType: selectedFile.type,
    })
    if (uploadError) {
      const { error: removeError } = await supabase.storage.from('fotos_produtos').remove([bannerPath])
      if (!removeError) {
        const retryUpload = await supabase.storage.from('fotos_produtos').upload(bannerPath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: selectedFile.type,
        })
        uploadError = retryUpload.error
      }
    }
    if (uploadError) {
      setFeedback(`Não foi possível salvar o ${BANNER_CONFIG[bannerKey].label.toLowerCase()}.`, 'error')
      setBannerUploadLoading((prev) => ({ ...prev, [bannerKey]: false }))
      return
    }
    const refreshedUrl = withCacheBusting(getBannerPublicUrl(targetFileName))
    if (bannerImages[bannerKey]?.preview?.startsWith('blob:')) URL.revokeObjectURL(bannerImages[bannerKey].preview)
    setBannerImages((prev) => ({
      ...prev,
      [bannerKey]: { ...prev[bannerKey], file: null, preview: '', existingUrl: refreshedUrl },
    }))
    setBannerUploadLoading((prev) => ({ ...prev, [bannerKey]: false }))
    setFeedback(`${BANNER_CONFIG[bannerKey].label} atualizado com sucesso.`)
  }

  const uploadImages = async () => {
    if (!selectedImages.length) return null
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
      if (uploadError) throw new Error('Erro ao enviar uma das imagens. Verifique os arquivos e tente novamente.')
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
      if (uploadedUrls?.length) payload.fotos = uploadedUrls

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
        setActiveTab('produtos')
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

  const tabs = [
    { key: 'produtos', label: 'Produtos' },
    { key: 'formulario', label: editingProductId ? 'Editar Produto' : 'Novo Produto' },
    { key: 'banners', label: 'Banners' },
  ]

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-header__brand">
          <picture>
            <source media="(min-width: 840px)" srcSet={logoWhiteLine} />
            <img src={logoWhiteRetangular} alt="Cacarecos & Amenidades" className="admin-header__logo" draggable="false" />
          </picture>
          <span className="admin-header__badge">Admin</span>
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

      {stats && (
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-card__value">{stats.total}</span>
            <span className="admin-stat-card__label">Total</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__value admin-stat-card__value--available">{stats.disponiveis}</span>
            <span className="admin-stat-card__label">Disponíveis</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__value admin-stat-card__value--reserved">{stats.reservados}</span>
            <span className="admin-stat-card__label">Reservados</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-card__value">{stats.aMao}</span>
            <span className="admin-stat-card__label">Feito à mão</span>
          </div>
        </div>
      )}

      <nav className="admin-tabs" aria-label="Seções do painel">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            className={`admin-tab-button${activeTab === key ? ' is-active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="admin-panel" aria-label="Conteúdo do painel">

        {/* ── TAB: PRODUTOS ── */}
        {activeTab === 'produtos' && (
          <>
            <div className="admin-filters">
              <input
                type="search"
                className="admin-search"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="admin-filter-row">
                <div className="admin-chip-group">
                  {STATUS_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className={`admin-chip${statusFilter === key ? ' is-active' : ''}`}
                      onClick={() => setStatusFilter(statusFilter === key ? 'todos' : key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span className="admin-filter-divider" aria-hidden="true" />
                <div className="admin-chip-group">
                  {CATEGORY_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className={`admin-chip${categoryFilter === key ? ' is-active' : ''}`}
                      onClick={() => setCategoryFilter(categoryFilter === key ? 'todos' : key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {!isLoading && (
                <p className="admin-results-count">
                  {filteredProdutos.length === produtos.length
                    ? `${produtos.length} produto${produtos.length !== 1 ? 's' : ''}`
                    : `Mostrando ${filteredProdutos.length} de ${produtos.length}`}
                </p>
              )}
            </div>

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
            ) : filteredProdutos.length === 0 ? (
              <p className="admin-panel__placeholder">
                {produtos.length === 0
                  ? 'Nenhum produto cadastrado ainda.'
                  : 'Nenhum produto encontrado com esses filtros.'}
              </p>
            ) : (
              <ul className="admin-product-list">
                {filteredProdutos.map((product) => {
                  const coverImage =
                    Array.isArray(product.fotos) && product.fotos.length > 0
                      ? product.fotos[0]
                      : PRODUCT_PLACEHOLDER_IMAGE
                  const isReserved = product.status?.toLowerCase() === 'reservado'
                  const isActionLoading = actionLoadingId === product.id
                  const isDeleteConfirm = deleteConfirmId === product.id

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
                          className={`admin-danger-button${isDeleteConfirm ? ' is-confirm' : ''}`}
                          onClick={() => handleDelete(product.id)}
                          disabled={isActionLoading}
                        >
                          {isDeleteConfirm ? 'Tem certeza?' : 'Excluir'}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        {/* ── TAB: FORMULÁRIO ── */}
        {activeTab === 'formulario' && (
          <form className="admin-form" onSubmit={handleSubmitProduct}>
            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="nome">Nome</label>
                <input id="nome" name="nome" value={formData.nome} onChange={handleFormChange} required />
              </div>

              <div className="admin-form-field admin-form-field--full">
                <label htmlFor="descricao">Descrição</label>
                <textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleFormChange} rows={3} required />
              </div>

              <div className="admin-form-field">
                <label htmlFor="preco">Preço</label>
                <input id="preco" name="preco" type="number" min="0" step="0.01" value={formData.preco} onChange={handleFormChange} />
              </div>

              <div className="admin-form-field">
                <label htmlFor="estado_uso">Estado de uso</label>
                <select id="estado_uso" name="estado_uso" value={formData.estado_uso} onChange={handleFormChange}>
                  <option value="Novo">Novo</option>
                  <option value="Seminovo">Seminovo</option>
                  <option value="Bom estado">Bom estado</option>
                  <option value="Com avarias">Com avarias</option>
                </select>
              </div>

              <div className="admin-form-field">
                <label htmlFor="categoria">Categoria</label>
                <select id="categoria" name="categoria" value={formData.categoria} onChange={handleFormChange}>
                  <option value="Venda">Venda</option>
                  <option value="Doação">Doação</option>
                </select>
              </div>

              <div className="admin-form-field">
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
              </div>

              <div className="admin-form-field">
                <label htmlFor="motivo_desapego">Motivo do desapego</label>
                <input
                  id="motivo_desapego"
                  name="motivo_desapego"
                  value={formData.motivo_desapego}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="dimensoes">Dimensões</label>
                <input id="dimensoes" name="dimensoes" value={formData.dimensoes} onChange={handleFormChange} />
              </div>

              <div className="admin-form-field admin-form-field--full">
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
                          className={`admin-image-preview${index === 0 ? ' is-cover' : ''}${draggedIndex === index ? ' is-dragging' : ''}`}
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
              </div>

              <div className="admin-form-field admin-form-field--full">
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
              </div>
            </div>

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
              <button type="button" className="admin-ghost-button" onClick={handleCancelEdit}>
                Cancelar edição
              </button>
            )}
          </form>
        )}

        {/* ── TAB: BANNERS ── */}
        {activeTab === 'banners' && (
          <div className="admin-banner-grid">
            {Object.values(BANNER_CONFIG).map((banner) => {
              const bannerData = bannerImages[banner.key]
              const previewUrl = bannerData.preview || bannerData.existingUrl
              return (
                <div key={banner.key} className="admin-banner-block">
                  <p className="admin-image-upload__label">{banner.label}</p>
                  <label
                    className="admin-dropzone"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      handleSelectBanner(banner.key, event.dataTransfer?.files)
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="admin-file-input-hidden"
                      onChange={(event) => handleSelectBanner(banner.key, event.target.files)}
                    />
                    {previewUrl ? (
                      <img src={previewUrl} alt={`Pré-visualização do ${banner.label}`} className="admin-dropzone__preview" />
                    ) : (
                      <span className="admin-dropzone__text">Arraste uma imagem aqui ou clique para selecionar</span>
                    )}
                  </label>
                  <p className="admin-image-upload__hint">{banner.helperText}</p>
                  <button
                    type="button"
                    className="admin-upload-button"
                    onClick={() => handleUploadBanner(banner.key)}
                    disabled={bannerUploadLoading[banner.key]}
                  >
                    {bannerUploadLoading[banner.key] ? 'Salvando banner...' : 'Salvar banner'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

      </section>
    </main>
  )
}

export default AdminDashboard
