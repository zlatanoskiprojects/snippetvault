import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import Root from './Root'

export function render(url: string): string {
  return renderToString(
    <Root router={children => <StaticRouter location={url}>{children}</StaticRouter>} />
  )
}
