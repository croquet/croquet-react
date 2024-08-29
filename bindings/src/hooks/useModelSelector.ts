import { ReactModel } from '../ReactModel'
import { useEffect, useState } from 'react'
import { useCroquetContext } from './useCroquetContext'
import hash_fn, { NotUndefined } from 'object-hash'

type ModelState<V> = {
  value: V
  hash: string | V
}

export function useModelSelector<M extends ReactModel, R extends NotUndefined>(selector: (m: M) => R): R {
  const { session, view, model } = useCroquetContext<M>()

  // The selector function may return a pointer to an object/array/etc,
  // Storing the returned value's hash allows to determine if it has changed.
  // The hash must be computed when the value is set, since
  // doing it at compare time would result in the same output.
  const [modelState, setModelState] = useState<ModelState<R>>(() => {
    const value = selector(model!)
    return { value, hash: hash_fn(value) }
  })

  useEffect(() => {
    if (!session || !view) return

    const handler = () => {
      setModelState((prev) => {
        const newValue = selector(model!)
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

    return () => {
      view.unsubscribe(session.id, 'react-updated', handler)
    }
    // Not including `selector` on purpose because we don't want
    // to force users to use the `useCallback` hook
  }, [session, view, model])

  return modelState.value
}
