import { useEffect, useState, useRef } from 'react'
import { CroquetSession } from '@croquet/croquet'
import { CroquetReactView } from '../CroquetReactView'
import { setSyncedCallback } from '../CroquetReactView'
import { CroquetContext } from './CroquetContext'
import { createCroquetSession, CroquetReactSessionParameters } from '../createCroquetSession'

export type ChangeSessionParameters = Partial<Pick<CroquetReactSessionParameters, 'name' | 'password'>>

type CroquetRootProps = {
  sessionParams: CroquetReactSessionParameters
  children: JSX.Element | JSX.Element[]
}

/** CroquetRoot component implements the default implementation of the logic described for createCroquetSession function.
 */
export function CroquetRoot({ sessionParams, children }: CroquetRootProps): JSX.Element | null {
  // Make sure we only create a new session once, even with strict mode
  const croquetSessionState = useRef<CroquetSession<CroquetReactView> | 'joining' | null>(null)

  const [croquetSession, setCroquetSession] = useState<CroquetSession<CroquetReactView> | null>(null)
  const [croquetView, setCroquetView] = useState<CroquetReactView | null>(null)
  const [currentSessionParams, setCurrentSessionParams] = useState(sessionParams)

  // This function updates the state (session, view)
  function updateState(session: CroquetSession<CroquetReactView>): void {
    setCroquetSession(session)
    setCroquetView(session?.view)
  }

  // Update currentSessionParams when props change
  useEffect(() => setCurrentSessionParams(sessionParams), [sessionParams])

  // Manage session dis/connection:
  // When connecting to a new session, we should setup view callbacks
  // Before connecting to a new session, we should leave the current one
  useEffect(() => {
    async function connect(): Promise<void> {
      // If already connected, do nothing
      if (croquetSessionState.current) return

      croquetSessionState.current = 'joining'
      const session = await createCroquetSession(currentSessionParams as any)
      croquetSessionState.current = session

      updateState(session)

      setSyncedCallback((flag) => {
        const session = croquetSessionState.current
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
      const session = croquetSessionState.current
      if (session !== null && session !== 'joining') {
        croquetSessionState.current = null
        session.leave()
      }
    }
  }, [currentSessionParams])

  const changeSession = async (newParams: ChangeSessionParameters = {}) => {
    setCurrentSessionParams({
      ...currentSessionParams,
      name: newParams.name || currentSessionParams.name,
      password: newParams.password || currentSessionParams.password,
    })
  }

  if (croquetView) {
    const contextValue = {
      session: croquetSession,
      view: croquetView,
      model: croquetView.model,
      changeSession,
    }
    return <CroquetContext.Provider value={contextValue}>{children}</CroquetContext.Provider>
  }
  return null
}
