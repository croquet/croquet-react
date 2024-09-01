import { useEffect, useState } from 'react'
import { ReactModel } from '../ReactModel'
import { useCroquetContext } from './useCroquetContext'
import { useIsConnected } from './useIsConnected'

interface ConnectedViews {
  views: string[]
  viewCount: number
}

const noViews = { views: [], viewCount: 0 }

function viewsSelector(rootModel: ReactModel | null): ConnectedViews {
  if(!rootModel?.__views) return noViews
  const views = rootModel.__views
  return {
    views: Array.from(views),
    viewCount: views.size,
  }
}
export function useConnectedViews(): ConnectedViews {
  const { session, view, model } = useCroquetContext()
  const isConnected = useIsConnected()

  const [views, setViews] = useState(viewsSelector(model))

  useEffect(() => {
    if (session && view && model) {
      const handler = () => setViews(viewsSelector(model))
      view.subscribe(session.id, {event: 'views-updated', handling: 'oncePerFrame'}, handler)
      return () => view.unsubscribe(session.id, 'views-updated', handler)
    }
  }, [session, view, model])

  useEffect(() => {
    isConnected ? setViews(viewsSelector(model)) : setViews(noViews)
  }, [isConnected, model, setViews])

  if (model && !model.__views) {
    throw new Error(
      'Your root model is not tracking the connected views.\n' +
        'Pass `options: { trackViews: true }` to your <CroquetRoot> component to start tracking them\n'
    )
  }
  return views
}
