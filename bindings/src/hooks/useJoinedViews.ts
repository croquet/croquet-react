import { useEffect, useState } from 'react'
import { ReactModel, type ViewInfo } from '../ReactModel'
import { useCroquetContext } from './useCroquetContext'

interface JoinedViews<T> {
  viewIds: string[]
  viewInfos: { [viewId: string]: ViewInfo<T> }
  viewCount: number
  // Deprecated
  views: string[]
}

// Make sure we only warn once
let warned = false
function deprecatedViewsPropertyWarning() {
  if (warned) return
  warned = true
  console.warn('Accessing the `views` property of `useJoinedViews` is deprecated. Use `viewIds` instead.')
}

const EMPTY_ARRAY: string[] = []
const EMPTY_OBJECT = {}

const NO_VIEWS = {
  viewIds: EMPTY_ARRAY,
  viewInfos: EMPTY_OBJECT,
  viewCount: 0,

  get views() {
    deprecatedViewsPropertyWarning()
    return this.viewIds
  }
}

function viewsSelector<T>(rootModel: ReactModel<T> | null): JoinedViews<T> {
  if(!rootModel?.__views) return NO_VIEWS as JoinedViews<T>
  const views = rootModel.__views
  return {
    viewIds: Array.from(views.keys()),
    viewInfos: Object.fromEntries(views.entries()),
    viewCount: views.size,

    get views() {
      deprecatedViewsPropertyWarning()
      return this.viewIds
    }
  }
}
export function useJoinedViews<T = undefined>(): JoinedViews<T> {
  const { session, view, model } = useCroquetContext<ReactModel<T>>()

  const [views, setViews] = useState(viewsSelector<T>(model))

  useEffect(() => {
    if (session && view && model) {
      const handler = () => setViews(viewsSelector<T>(model))
      view.subscribe(session.id, {event: 'views-updated', handling: 'oncePerFrame'}, handler)
      handler()
      return () => view.unsubscribe(session.id, 'views-updated', handler)
    } else {
      setViews(NO_VIEWS)
    }
  }, [session, view, model])

  if (model && !model.__views) {
    throw new Error(
      'Your root model is not tracking the joined views.\n' +
        'Pass `options: { trackViews: true }` to your <CroquetRoot> component to start tracking them\n'
    )
  }
  return views
}
