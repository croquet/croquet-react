import { useEffect, useState, useRef, useCallback } from 'react'
import { CroquetSession } from '@croquet/croquet'
import { CroquetReactView } from '../CroquetReactView'
import { setSyncedCallback } from '../CroquetReactView'
import { CroquetContext } from './CroquetContext'
import { createCroquetSession, CroquetReactSessionParameters } from '../createCroquetSession'
import { ReactModel } from '../ReactModel'

export interface ChangeSessionParameters {
  name: string
  password?: string
}

interface ReactSessionParameters<M extends ReactModel> extends Omit<CroquetReactSessionParameters<M>, 'name'> {
  name?: string
  password?: string
}

type CroquetRootProps<M extends ReactModel> = {
  sessionParams: ReactSessionParameters<M>
  children: JSX.Element | JSX.Element[]
  showChildrenWhenDisconnected?: boolean
}

/** CroquetRoot component implements the default implementation of the logic described for createCroquetSession function.
 */
export function CroquetRoot<M extends ReactModel>({
  sessionParams,
  children,
  showChildrenWhenDisconnected = false,
}: CroquetRootProps<M>): JSX.Element | null {
  // Make sure we only create a new session once, even with strict mode
  const croquetSessionRef = useRef<CroquetSession<CroquetReactView<M>> | 'joining' | null>(null)

  // Used for smooth session transitioning
  const nextSessionRef = useRef<CroquetSession<CroquetReactView<M>> | null>(null)

  const [croquetSession, setCroquetSession] = useState<CroquetSession<CroquetReactView<M>> | null>(null)
  const [croquetView, setCroquetView] = useState<CroquetReactView<M> | null>(null)
  const [currentSessionParams, setCurrentSessionParams] = useState(sessionParams)

  // This function updates the state (session, view)
  const updateState = useCallback(
    (session: CroquetSession<CroquetReactView<M>> | null) => {
      setCroquetSession(session)
      setCroquetView(session?.view || null)
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

      if (nextSessionRef.current) {
        // We are already connected to the next session
        croquetSessionRef.current = nextSessionRef.current
        nextSessionRef.current = null
      } else {
        croquetSessionRef.current = 'joining'
        croquetSessionRef.current = await createCroquetSession<M>(currentSessionParams as any)
      }
      const session = croquetSessionRef.current

      updateState(session)

      setSyncedCallback((flag) => {
        const session = croquetSessionRef.current
        if (session !== null && session !== 'joining') {
          if (flag) updateState(session)
          if (session.view) {
            session.view.detachCallback = () => {
              setCroquetView(null)
            }
          }
        }
      })
    }

    connect()

    return () => {
      const session = croquetSessionRef.current
      if (session !== null && session !== 'joining') {
        croquetSessionRef.current = null
        session.leave()
      }
    }
  }, [currentSessionParams, updateState])

  const changeSession = useCallback(
    async ({ name, password }: ChangeSessionParameters) => {
      // Smooth session transitioning: Only update state
      // after we are connected to the next session
      const newParams = {
        ...currentSessionParams,
        name,
        password: password || currentSessionParams.password,
      }

      nextSessionRef.current = await createCroquetSession(newParams)
      setCurrentSessionParams(newParams)
    },
    [setCurrentSessionParams, currentSessionParams]
  )

  const leaveSession = useCallback(() => {
    setCurrentSessionParams((prev) => ({
      ...prev,
      name: undefined,
      password: undefined,
    }))
    updateState(null)
  }, [setCurrentSessionParams, updateState])

  if (croquetView || showChildrenWhenDisconnected) {
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
