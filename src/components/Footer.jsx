function Footer() {
  return (
    <footer className="site-footer" aria-label="Rodapé do projeto">
      <div className="site-footer__content">
        <h2>Cacarecos e Amenidades</h2>
        <p>
          Projeto criado para facilitar a reserva de itens que estamos desapegando para investir na nossa casa, no
          nosso casamento ou em mais cacarecos e amenidades.
        </p>
        <p className="site-footer__opensource">
          Este projeto é open-source. Faça um fork em{' '}
          <a href="https://github.com/reesoousa/cacarecos-e-amenidades" target="_blank" rel="noreferrer">
            github.com/reesoousa/cacarecos-e-amenidades
          </a>
          .
        </p>

        <nav className="site-footer__social" aria-label="Links sociais">
          <a href="https://github.com/reesoousa" target="_blank" rel="noreferrer" aria-label="GitHub">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2A10 10 0 0 0 8.84 21.5c.5.08.68-.21.68-.48v-1.87c-2.78.61-3.37-1.2-3.37-1.2-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.61.07-.61 1 .07 1.52 1.02 1.52 1.02.88 1.52 2.32 1.08 2.89.83.09-.65.34-1.08.62-1.33-2.22-.25-4.55-1.11-4.55-4.95 0-1.1.4-2 1.03-2.71-.1-.25-.45-1.28.1-2.66 0 0 .84-.27 2.75 1.04a9.6 9.6 0 0 1 5 0c1.9-1.3 2.74-1.04 2.74-1.04.55 1.38.2 2.4.1 2.66.64.71 1.03 1.61 1.03 2.71 0 3.85-2.34 4.7-4.57 4.95.35.3.67.9.67 1.81v2.68c0 .27.18.57.69.48A10 10 0 0 0 12 2Z" />
            </svg>
            GitHub
          </a>
          <a href="https://x.com/lobosoIidario" target="_blank" rel="noreferrer" aria-label="X / Twitter">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m3 3 7.56 10.8L3.5 21h2.8l5.53-6.16L16.13 21H21l-7.9-11.28L19.8 3H17l-4.97 5.54L8.16 3H3Zm3.2 1.8h1.03l9.57 13.4h-1.03L6.2 4.8Z" />
            </svg>
            X
          </a>
          <a href="https://www.linkedin.com/in/reesoousa/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A2 2 0 1 0 5.3 7a2 2 0 0 0-.05-4ZM20 13.4c0-3.52-1.88-5.16-4.4-5.16-2.03 0-2.94 1.12-3.45 1.9V8.5H8.78V20h3.37v-5.7c0-1.5.29-2.94 2.15-2.94 1.83 0 1.86 1.7 1.86 3.04V20H20v-6.6Z" />
            </svg>
            LinkedIn
          </a>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
