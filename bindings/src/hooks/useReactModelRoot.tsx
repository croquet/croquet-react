import { usePublish } from './usePublish'
import { ReactModel } from '../ReactModel'
import { useState } from 'react'
import { useCroquetContext } from './useCroquetContext'

function getModelObject<T extends ReactModel>(model: T): T {
  const methods: Partial<T> = {}
  const excludeMethods = new Set(['view-join', 'view-exit'])
  model.__reactEvents
    .filter((e) => !excludeMethods.has(e.event))
    .forEach(({ scope, event }) => {
      // @ts-expect-error ---
      methods[event] = usePublish((data) => [scope, event, data])
    })

  const properties: Partial<T> = {}
  const excludeProperties = new Set(['__reactEvents'])
  for (const p in model) {
    if (!excludeProperties.has(p)) {
      const prop = model[p]
      if (prop instanceof ReactModel) {
        properties[p] = getModelObject(prop)
      } else {
        properties[p] = prop
      }
    }
  }

  return { ...properties, ...methods } as T
}

export function useReactModelRoot<T extends ReactModel>(): T {
  const { session, view, model } = useCroquetContext()
  const [modelState, setModelState] = useState(model  as T)

  if (session && view) {
    view.subscribe(
      session.id,
      {
        event: 'react-updated',
        handling: 'oncePerFrame',
      },
      () => {
        // Here we are creating a shallow copy of model to
        // force react to rerender with the updated data
        // console.log('@croquet/react: react-updated')
        setModelState({ ...model } as T)
      }
    )
  }

  return getModelObject(modelState)
}
