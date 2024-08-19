import { ReactModel } from '../ReactModel'
import { useEffect, useState } from 'react'
import { useCroquetContext } from './useCroquetContext'

export function useReactModelRootProperty<T extends ReactModel, V>(id: string, fn: (m: T | null) => V): V {
  const { session, view, model } = useCroquetContext()
  const [modelState, setModelState] = useState(fn(model as T))

  useEffect(() => {
    // console.log(`[${id}] Subscribing to react-updated`)
    if (session && view) {
      const handler = () => {
        // console.log('@croquet/react: react-updated')
        setModelState((prev) => {
          const newValue = fn(model as T)
          if(prev !== newValue) {
            console.log({id, prev, newValue, equals: prev === newValue})
            return newValue
          } else {
            // console.log(`[${id}] @croquet/react: react-updated`)
          }
          return prev
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
    }
  }, [session, view, model])

  return modelState
}
