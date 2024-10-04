import { ReactModel } from '../ReactModel'
import { useEffect, useState } from 'react'
import { useCroquetContext } from './useCroquetContext'
import { CroquetReactView } from '../CroquetReactView'

function getModelObject<T extends ReactModel>(view: CroquetReactView<T> | null, model: T | null): T | null {
  const methods: Partial<T> = {}
  const excludeMethods = new Set(['view-join', 'view-exit'])
  if (!view || !model) return null

  model.__reactEvents
    .filter((e) => !excludeMethods.has(e.event))
    .forEach(({ scope, event }) => {
      // Not using usePublish to keep this function pure
      // @ts-expect-error ---
      methods[event] = (data) => view.publish(scope, event, data)
    })

  const properties: Partial<T> = {}
  const excludeProperties = new Set(['__reactEvents'])
  for (const p in model) {
    if (!excludeProperties.has(p)) {
      const prop = model[p]
      if (prop instanceof ReactModel) {
        // @ts-expect-error ---
        properties[p] = getModelObject(view, prop)!
      } else {
        properties[p] = prop
      }
    }
  }

  return { ...properties, ...methods } as T
}

export function useReactModelRoot<T extends ReactModel>(): T | null {
  const { session, view, model } = useCroquetContext<T>()
  const [modelState, setModelState] = useState(getModelObject(view, model))

  useEffect(() => {
    if (!session || !view || !model) {
      setModelState(null)
      return
    }

    // Here we are creating a shallow copy of model to
    // force react to rerender with the updated data
    // console.log('@croquet/react: react-updated')
    const handler = () => setModelState(getModelObject(view, model))

    view.subscribe(session.id, { event: 'react-updated', handling: 'oncePerFrame' }, handler)
    handler()
    return () => view.unsubscribe(session.id, 'react-updated', handler)
  }, [session, view, model, setModelState])

  return modelState
}
