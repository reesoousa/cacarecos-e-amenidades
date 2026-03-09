function Skeleton({ className = '', as: Component = 'div' }) {
  return <Component className={`skeleton ${className}`.trim()} aria-hidden="true" />
}

export default Skeleton
