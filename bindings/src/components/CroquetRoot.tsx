import { useEffect, useState, useRef, useCallback } from 'react'
import { CroquetSession, App } from '@croquet/croquet'
import { CroquetReactView } from '../CroquetReactView'
import { setSyncedCallback } from '../CroquetReactView'
import { CroquetContext } from './CroquetContext'
import { createCroquetSession, CroquetReactSessionParameters } from '../createCroquetSession'
import { ReactModel } from '../ReactModel'

export interface ReactSessionParameters<M extends ReactModel> extends Omit<CroquetReactSessionParameters<M>, 'name'> {
  name?: string
  password?: string
}

interface CroquetRootProps<M extends ReactModel> {
  sessionParams: ReactSessionParameters<M>
  children: React.ReactElement | React.ReactElement[] | null
  showChildrenWithoutSession?: boolean
  deferSession?: boolean
}

interface SessionParamsState<M extends ReactModel> extends ReactSessionParameters<M> {
  join: boolean
}

/** CroquetRoot component implements the default implementation of the logic described for createCroquetSession function.
 */
export function CroquetRoot<M extends ReactModel>({
  sessionParams,
  children,
  showChildrenWithoutSession = false,
  deferSession = false,
}: CroquetRootProps<M>): JSX.Element | null {
  // Make sure we only create a new session once, even with strict mode
  const croquetSessionRef = useRef<CroquetSession<CroquetReactView<M>> | 'joining' | null>(null)

  // Used for smooth session transitioning
  const nextSessionRef = useRef<CroquetSession<CroquetReactView<M>> | null>(null)

  const [croquetSession, setCroquetSession] = useState<CroquetSession<CroquetReactView<M>> | null>(null)
  const [croquetView, setCroquetView] = useState<CroquetReactView<M> | null>(null)
  const [currentSessionParams, setCurrentSessionParams] = useState<SessionParamsState<M>>(() => { 
    if(!deferSession) {
      if(!sessionParams.name) {
        sessionParams.name = App.randomSession()
      }
      if(!sessionParams.password) {
        sessionParams.password = App.randomPassword()
      }
    }
    return { ...sessionParams, join: !deferSession } 
  })

  // This function updates the state (session, view)
  const updateState = useCallback(
    (session: CroquetSession<CroquetReactView<M>> | null) => {
      setCroquetSession(session)
      setCroquetView(session?.view ?? null)
    },
    [setCroquetSession, setCroquetView]
  )

  // Update currentSessionParams when props change
  useEffect(
    () => setCurrentSessionParams({ ...sessionParams, join: !deferSession }),
    [sessionParams, deferSession, setCurrentSessionParams]
  )

  // Session management
  // When joining a new session, we should setup view callbacks
  // Before joining a new session, we should leave the current one
  useEffect(() => {
    async function join(): Promise<void> {
      // If already joined, do nothing
      if (croquetSessionRef.current) return

      // If explicitly told to not join, do not join
      if (!currentSessionParams.join) return

      if (nextSessionRef.current) {
        // We are already joined to the next session
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

    join()

    return () => {
      const session = croquetSessionRef.current
      if (session !== null && session !== 'joining') {
        croquetSessionRef.current = null
        session.leave()
      }
    }
  }, [currentSessionParams, updateState])

  const setSession = useCallback(
    async (params: Partial<Omit<ReactSessionParameters<M>, 'model'>>) => {
      // Smooth session transitioning: Only update state
      // after we joined the next session
      const newParams = {
        ...currentSessionParams,
        ...params,
        join: true,
      }

      if(!newParams.name) {
        newParams.name = App.randomSession()
      }
      if(!newParams.password) {
        newParams.password = App.randomPassword()
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { join, ...args } = newParams

      // @ts-expect-error name can be undefined
      createCroquetSession(args).then((newSession) => {
        nextSessionRef.current = newSession
        setCurrentSessionParams(newParams)
      })
    },
    [setCurrentSessionParams, currentSessionParams]
  )

  const leaveSession = useCallback(() => {
    setCurrentSessionParams((prev) => ({ ...prev, join: false }))
    updateState(null)
  }, [setCurrentSessionParams, updateState])

  if ((currentSessionParams.join && croquetView) || showChildrenWithoutSession) {
    const contextValue = {
      sessionParams: currentSessionParams,
      session: croquetSession,
      view: croquetView,
      model: croquetView?.model || null,
      setSession,
      leaveSession
    }
    return (
      <CroquetContext.Provider value={contextValue}>
        {children}
      </CroquetContext.Provider>
    )
  }
  return null
}
