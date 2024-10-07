import { ReactModel } from '../ReactModel'
import { useEffect, useState } from 'react'
import { useCroquetContext } from './useCroquetContext'
import hash_fn, { NotUndefined } from 'object-hash'

interface ModelState<V> {
  value: V | null
  hash: string | null
}

export function useModelSelector<M extends ReactModel, R extends NotUndefined>(selector: (m: M) => R): (R | null)  {
  // Storing the first function received in state so that we stick to the first one
  // const [actualSelector] = useState<(m: M) => R>(selector)

  const { session, view, model } = useCroquetContext<M>()

  // The selector function may return a pointer to an object/array/etc,
  // Storing the returned value's hash allows to determine if it has changed.
  // The hash must be computed when the value is set, since
  // doing it at compare time would result in the same output.
  const [modelState, setModelState] = useState<ModelState<R>>(() => {
    if(!model) {
      return { value: null, hash: null }
    }
    const value = selector(model)
    return { value, hash: hash_fn(value) }
  })

  useEffect(() => {
    if (!session || !view || !model) {
      // If the previous state was undefined, we return the same object
      setModelState((prev) => (prev.value === null ? prev : { value: null, hash: null }))
      return
    }

    const handler = () => {
      setModelState((prev) => {
        const newValue = selector(model)
        const newHash = hash_fn(newValue)
        return prev.hash === newHash ? prev : { value: newValue, hash: newHash }
      })
    }
    view.subscribe(
      session.id,
      {
        event: 'react-updated',
        handling: 'oncePerFrame',
      },
      handler
    )
    handler()

    return () => view.unsubscribe(session.id, 'react-updated', handler)
  }, [session, view, model])

  return modelState.value
}
