import { ReactModel } from '../ReactModel'
import { useEffect, useState } from 'react'
import { useCroquetContext } from './useCroquetContext'
import hash_fn, { NotUndefined } from 'object-hash'

type ModelState<V> = {
  value: V
  hash: string | V
}

export function useModelSelector<T extends ReactModel, V>(selector: (m: T | null) => V): V {
  const { session, view, model } = useCroquetContext()

  // The selector function may return a pointer to an object/array/etc,
  // Storing the returned value's hash allows to determine if it has changed.
  // The hash must be computed when the value is set, since
  // doing it at compare time would result in the same output.
  const [modelState, setModelState] = useState<ModelState<V>>(() => {
    const value = selector(model as T)
    return { value, hash: hash_fn(value as NotUndefined) }
  })

  useEffect(() => {
    if (!session || !view) return

    const handler = () => {
      setModelState((prev) => {
        const newValue = selector(model as T)
        const newHash = hash_fn(newValue as NotUndefined)
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
      // @ts-expect-error we know this function receives a handler
      view.unsubscribe(session.id, 'react-updated', handler)
    }
  }, [session, view, model])

  return modelState.value
}
