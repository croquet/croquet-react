import { useEffect, useState, useRef, createElement } from 'react'
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
  const [currentSessionParams, setCurrentSessionParams] = useState(sessionParams)
  const [croquetSession, setCroquetSession] = useState<CroquetSession<CroquetReactView> | null>(null)
  const [croquetView, setCroquetView] = useState<CroquetReactView | null>(null)

  const changeSession = (newParams: ChangeSessionParameters = {}) => {
    setCurrentSessionParams({
      ...currentSessionParams,
      name: newParams.name || currentSessionParams.name,
      password: newParams.password || currentSessionParams.password,
    })
  }

  // Make sure we only create a new session once, even with strict mode
  // const joining = useRef(false)
  const croquetSessionState = useRef<CroquetSession<CroquetReactView> | 'joining' | null>(null)

  // This function updates the state (session, view and model) and subscribes the view
  // to react-updated events to refresh the model state whenever there is a model change.
  function updateState(session: CroquetSession<CroquetReactView>): void {
    const view = session?.view
    setCroquetSession(session)
    setCroquetView(view)
  }

  // Update currentSessionParams when props change
  useEffect(() => setCurrentSessionParams(sessionParams), [sessionParams])

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
      const session = croquetSessionState.current
      if (session !== null && session !== 'joining') {
        session.leave()
        croquetSessionState.current = null
      }
    }
  }, [currentSessionParams])

  if (croquetView) {
    const contextValue = {
      session: croquetSession,
      view: croquetView,
      model: croquetView.model,
      changeSession,
    }
    return createElement(CroquetContext.Provider, { value: contextValue }, children)
  }
  return null
}
