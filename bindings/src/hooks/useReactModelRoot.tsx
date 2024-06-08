import { useModelRoot } from './useModelRoot'
import { ReactModel } from '../ReactModel'
import { useCroquetView } from './useCroquetView';
import { CroquetReactView } from '../CroquetReactView';

// We need to receive croquetView to pass it to eventual getModelObject calls
function convertRecursively<T>(what: T, croquetView: CroquetReactView): T {
  if (what instanceof ReactModel) {
    return getModelObject(what, croquetView)
  }
  if(what instanceof Array) {
    return what.map(w => convertRecursively(w, croquetView)) as T;
  }
  if (what instanceof Object) {
    const result = {}
    Object.entries(what).forEach(([key, value]) => {
      // @ts-expect-error ---
      result[key] = convertRecursively(value)
    })
    
    return result as T
  }
  return what
}

// We need croquetView so that we can publish events
function getModelObject<T extends ReactModel>(model: T, croquetView: CroquetReactView): T {
  const methods: Partial<T> = {}
  const excludeMethods = new Set(['view-join', 'view-exit'])
  model.__reactEvents
    .filter((e) => !excludeMethods.has(e.event))
    .forEach(({ scope, event }) => {
      // Should not use the usePublsh hook because
      // the number of nested models may change over time
      // and the number of hooks inside a component should be constant

      // @ts-expect-error ---
      methods[event] = (data) => croquetView.publish(scope, event, data)
    })

  const properties: Partial<T> = {}
  const excludeProperties = new Set(['__reactEvents'])

  Object.entries(model)
  .filter(([key]) => !excludeProperties.has(key))
  .forEach(([key, value]) => {
    // @ts-expect-error ---
    properties[key] = convertRecursively(value, croquetView)
  })

  return { ...properties, ...methods } as T
}

export function useReactModelRoot<T extends ReactModel>(): T {
  const model = useModelRoot() as T
  const croquetView = useCroquetView()

  return getModelObject(model, croquetView!)
}
