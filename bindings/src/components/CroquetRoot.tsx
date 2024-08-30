import { useEffect, useState, useRef, useCallback } from 'react'
import { CroquetSession } from '@croquet/croquet'
import { CroquetReactView } from '../CroquetReactView'
import { setSyncedCallback } from '../CroquetReactView'
import { CroquetContext } from './CroquetContext'
import { createCroquetSession, CroquetReactSessionParameters } from '../createCroquetSession'
import { ReactModel } from '../ReactModel'

export interface ChangeSessionParameters {
  name?: string
  password?: string
}

interface ReactSessionParameters<M extends ReactModel> extends Omit<CroquetReactSessionParameters<M>, 'name'> {
  name?: string
  password?: string
}

type CroquetRootProps<M extends ReactModel> = {
  sessionParams: ReactSessionParameters<M>
  children: JSX.Element | JSX.Element[]
}

const SHOW_CHILDREN_WHEN_NO_SESSION = true

/** CroquetRoot component implements the default implementation of the logic described for createCroquetSession function.
 */
export function CroquetRoot<M extends ReactModel>({ sessionParams, children }: CroquetRootProps<M>): JSX.Element | null {
  // Make sure we only create a new session once, even with strict mode
  const croquetSessionRef = useRef<CroquetSession<CroquetReactView<M>> | 'joining' | null>(null)

  const [croquetSession, setCroquetSession] = useState<CroquetSession<CroquetReactView<M>> | null>(null)
  const [croquetView, setCroquetView] = useState<CroquetReactView<M> | null>(null)
  const [currentSessionParams, setCurrentSessionParams] = useState(sessionParams)

  // This function updates the state (session, view)
  const updateState = useCallback(
    (session: CroquetSession<CroquetReactView<M>>) => {
      setCroquetSession(session)
      setCroquetView(session?.view)
    },
    [setCroquetSession, setCroquetView]
  )

  // Update currentSessionParams when props change
  useEffect(() => setCurrentSessionParams(sessionParams), [sessionParams, setCurrentSessionParams])

  // Manage session dis/connection:
  // When connecting to a new session, we should setup view callbacks
  // Before connecting to a new session, we should leave the current one
  useEffect(() => {
    async function connect(): Promise<void> {
      // If already connected, do nothing
      if (croquetSessionRef.current) return

      // If no session name provided, do not connect
      if (!currentSessionParams.name) return

      croquetSessionRef.current = 'joining'
      const session = await createCroquetSession<M>(currentSessionParams as any)
      croquetSessionRef.current = session

      updateState(session)

      setSyncedCallback((flag) => {
        const session = croquetSessionRef.current
        if (session !== null && session !== 'joining') {
          if (flag) updateState(session)
          session.view.detachCallback = () => {
            setCroquetView(null)
          }
        }
      })
    }

    connect()

    return () => {
      // Reset session and view to null to prevent stale data in subsequent renders.
      // This is crucial because:
      // 1. This cleanup function runs asynchronously.
      // 2. Child components may render before the new session is established.
      // 3. Without resetting, children might capture and persist old session data,
      //    even after the parent updates with new session and view information.
      setCroquetView(null)
      setCroquetSession(null)
      const session = croquetSessionRef.current
      if (session !== null && session !== 'joining') {
        croquetSessionRef.current = null
        session.leave()
      }
    }
  }, [currentSessionParams, updateState])

  const changeSession = useCallback(
    ({ name, password }: ChangeSessionParameters) => {
      if (!name && !password) return

      setCurrentSessionParams((prev) => ({
        ...prev,
        name: name || prev.name,
        password: password || prev.password,
      }))
    },
    [setCurrentSessionParams]
  )

  const leaveSession = useCallback(() => {
    setCurrentSessionParams((prev) => ({
      ...prev,
      name: undefined,
      password: undefined,
    }))
  }, [setCurrentSessionParams])

  if (croquetView || SHOW_CHILDREN_WHEN_NO_SESSION) {
    const contextValue = {
      session: croquetSession,
      view: croquetView,
      model: croquetView?.model || null,
      changeSession,
      leaveSession,
    }
    return <CroquetContext.Provider value={contextValue}>{children}</CroquetContext.Provider>
  }
  return null
}
