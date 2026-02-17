import { Link as RouterLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function Link({ to, href, children, className, ...rest }) {
  const classes = cn('text-primary hover:underline', className)

  if (to) {
    return (
      <RouterLink to={to} className={classes} {...rest}>
        {children}
      </RouterLink>
    )
  }

  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  )
}
