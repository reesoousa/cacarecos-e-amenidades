import ProductCard from '../components/ProductCard'
import '../styles/home.css'

const mockProducts = [
  {
    id: 1,
    nome: 'Sofá 2 lugares retrô',
    descricao:
      'Sofá confortável em excelente estado, tecido de linho azul petróleo, ideal para sala compacta.',
    categoria: 'Venda',
    preco: 680,
    imagemUrl:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
    status: 'Disponível',
  },
  {
    id: 2,
    nome: 'Coleção de livros infantis',
    descricao:
      'Kit com 18 livros ilustrados para crianças de 4 a 8 anos. Todos higienizados e prontos para uso.',
    categoria: 'Doação',
    preco: 0,
    imagemUrl:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
    status: 'Disponível',
  },
  {
    id: 3,
    nome: 'Bicicleta aro 26 urbana',
    descricao:
      'Bicicleta com cestinha frontal e marchas revisadas recentemente. Possui pequenos sinais de uso.',
    categoria: 'Venda',
    preco: 540,
    imagemUrl:
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
    status: 'Reservado',
  },
  {
    id: 4,
    nome: 'Mesa de escritório compacta',
    descricao:
      'Mesa de madeira clara com ótimo espaço para notebook e material de estudo, perfeita para home office.',
    categoria: 'Venda',
    preco: 320,
    imagemUrl:
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80',
    status: 'Disponível',
  },
]

function Home() {
  return (
    <main className="home-page">
      <header className="home-hero">
        <p className="home-hero__eyebrow">Venda de garagem digital</p>
        <h1>Cacarecos & Amenidades</h1>
        <p className="home-hero__description">
          Um espaço para desapegar com carinho: venda ou doe itens em bom estado para quem realmente vai
          aproveitar.
        </p>
      </header>

      <section className="products-grid" aria-label="Lista de produtos disponíveis">
        {mockProducts.map((item) => (
          <ProductCard key={item.id} {...item} />
        ))}
      </section>
    </main>
  )
}

export default Home
