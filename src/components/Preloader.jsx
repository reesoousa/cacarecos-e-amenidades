import { useEffect } from 'react'
import logoBlackRetangular from '../visual-id/logo-cacarecos-black-retangular.svg'
import '../styles/preloader.css'

function Preloader({ onComplete }) {
  useEffect(() => {
    // 0.88s delay + 0.32s exit + buffer
    const timer = setTimeout(onComplete, 1250)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="preloader" aria-hidden="true">
      <img
        src={logoBlackRetangular}
        alt=""
        className="preloader__logo"
        draggable="false"
      />
    </div>
  )
}

export default Preloader
