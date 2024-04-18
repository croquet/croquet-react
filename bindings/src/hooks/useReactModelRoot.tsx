import { useModelRoot, usePublish } from '../..'
import { ReactModel } from '../..'

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
  const model = useModelRoot() as T

  return getModelObject(model)
}
