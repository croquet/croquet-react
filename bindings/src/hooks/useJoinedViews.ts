import { useEffect, useState } from 'react'
import { ReactModel } from '../ReactModel'
import { useCroquetContext } from './useCroquetContext'
import { useIsJoined } from './useIsJoined'

interface JoinedViews {
  views: string[]
  viewCount: number
}

const noViews = { views: [], viewCount: 0 }

function viewsSelector(rootModel: ReactModel | null): JoinedViews {
  if(!rootModel?.__views) return noViews
  const views = rootModel.__views
  return {
    views: Array.from(views),
    viewCount: views.size,
  }
}
export function useJoinedViews(): JoinedViews {
  const { session, view, model } = useCroquetContext()
  const isJoined = useIsJoined()

  const [views, setViews] = useState(viewsSelector(model))

  useEffect(() => {
    if (session && view && model) {
      const handler = () => setViews(viewsSelector(model))
      view.subscribe(session.id, {event: 'views-updated', handling: 'oncePerFrame'}, handler)
      return () => view.unsubscribe(session.id, 'views-updated', handler)
    }
  }, [session, view, model])

  useEffect(() => {
    isJoined ? setViews(viewsSelector(model)) : setViews(noViews)
  }, [isJoined, model, setViews])

  if (model && !model.__views) {
    throw new Error(
      'Your root model is not tracking the joined views.\n' +
        'Pass `options: { trackViews: true }` to your <CroquetRoot> component to start tracking them\n'
    )
  }
  return views
}
