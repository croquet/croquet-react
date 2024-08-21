import { useEffect, useState } from 'react'
import { ReactModel } from '../ReactModel'
import { useCroquetContext } from './useCroquetContext'

interface ConnectedViews {
  views: string[]
  viewCount: number
}

function viewsSelector<T extends ReactModel>(rootModel: T | null): ConnectedViews {
  if (!rootModel?.__views) return { views: [], viewCount: 0 }
  const views = rootModel.__views
  return {
    views: Array.from(views),
    viewCount: views.size,
  }
}
export function useConnectedViews(): ConnectedViews {
  const context = useCroquetContext()
  const { session, view } = context
  const model = context.model

  const [views, setViews] = useState(viewsSelector(model))

  useEffect(() => {
    const handler = () => {
      setViews(viewsSelector(model))
    }
    if (session && view) {
      view.subscribe(session.id, 'views-updated', handler)
      return () => {
        view.unsubscribe(session.id, 'views-updated', handler)
      }
    }
  }, [session, view, model])

  if (!model?.__views) {
    throw new Error(
      'Your root model is not tracking the connected views.\n' +
        'Pass `options: { trackViews: true }` to your <CroquetRoot> component to start tracking them\n'
    )
  }

  return views
}
