import { 
  useState,
  useEffect,
  createContext,
  createElement,
  useContext,
  useCallback,
  useRef
} from 'react' //prettier-ignore

import {
  View,
  Session,
  CroquetSession,
  Model,
  CroquetSessionParameters
} from '@croquet/croquet' //prettier-ignore

export {
  Model,
  View,
  Data,
  Session,
  Constants,
  App,
  CroquetSession,
  CroquetSessionParameters
} from '@croquet/croquet' //prettier-ignore

import { ReactModel } from './src/ReactModel'
export { ReactModel }
export { useReactModelRoot } from './src/useReactModelRoot'

// InCroquetSession parameter is almost the same but omits `view`,
// which is defaulted to CroquetReactView, but adds children
type CroquetReactSessionParameters = Omit<CroquetSessionParameters<Model, CroquetReactView>, 'view'> & {
  children: React.ReactNode | React.ReactNode[]
}

// A React context that stores the croquet session, view, and model
type ContextType = {
  session: CroquetSession<CroquetReactView> | null
  view: CroquetReactView | null
  model: ReactModel | null
}
export const CroquetContext = createContext<ContextType | undefined>(undefined)

function useCroquetContext(): ContextType {
  const contextValue = useContext(CroquetContext)
  if (!contextValue) throw new Error('Not inside Croquet context')
  return contextValue
}

function useCroquetView(): CroquetReactView | null {
  const { view } = useCroquetContext()
  return view
}

export function useCroquetSession(): CroquetSession<CroquetReactView> | null {
  const { session } = useCroquetContext()
  return session
}

/** Hook that gives access to the id of the client. This can be used as an identifier for different clients.
 */
export function useViewId(): string | undefined {
  const croquetView = useCroquetView()
  return croquetView?.viewId
}

/** Hook that gives access to the sessionId.
 */
export function useSessionId(): string | undefined {
  const session = useCroquetSession()
  return session?.id
}

/** Hook that gives access to the root Model of this croquet session.
 * Can be used to read Model properties (including other referenced Models),
 * and to publish events to the Model or to subscribe to Model events using the other hooks.
 */
export function useModelRoot(): ReactModel | null {
  const { model } = useCroquetContext()
  return model
}

/** Hook that gives access to the Model specified by an id of this croquet session.
 * Can be used to read Model properties (including other referenced Models),
 * and to publish events to the Model or to subscribe to Model events using the other hooks.
 */
export function useModelById(id: string): Model | undefined {
  const model = useModelRoot()
  return model?.getModel(id)
}

/** Hook that returns a function that will have an event publishing effect.
 * Needs to be provided with a `publishCallback` that determines the event and data to be published,
 * by either returning `[scope, event, data]` or just `[scope, event]`.
 * Any arguments passed to the function returned by the hook will be forwarded to `publishCallback` as-is.
 * Make sure that the callback function captures all its dependencies by creating one with useCallback, or pass a fresh function.
 *
 * The hook is parameterized by the type of data it publishes.
 * You can provide the same type for usePublish and subscribe on the model side to ensure the types are consistent.
 *
 * A simple example:
 * ```
 * function IncrementCounterButton({counterModel}) {
 *    const publishIncrement = usePublish<number>(
 *      () => [counterModel.id, 'increment', 1]
 *    )
 *
 *    return <button onClick={publishIncrement} value='Increment'/>
 * }
 * ```
 *
 * Forwarding arguments:
 * ```
 * function IncrementCounterBy10Button({counterModel}) {
 *    const publishIncrement = usePublish<number>(
 *      (incrementBy) => [counterModel.id, 'increment', incrementBy])
 *
 *    return <button onClick={() => publishIncrement(10)} value='Increment by 10'/>
 * }
 * ```
 */
export function usePublish<T>(
  publishCallback: (...args: any[]) => [string, string] | [string, string, T]
): (...args: any[]) => T | undefined {
  const croquetView = useCroquetView()
  return useCallback(
    (...args) => {
      if (croquetView === null) return
      const result = publishCallback(...args)
      let ret: T | undefined
      if (result && result.length >= 2) {
        const [scope, event, data] = result
        croquetView.publish(scope, event, data)
        ret = data
      }
      return ret
    },
    // deps are not in play here as publishCallback has to be fresh to capture what it depends on
    [publishCallback, croquetView]
  )
}

/** Hook that listens to events matching the provided `scope` and `eventSpec`.
 * Event data is passed as an argument to `callback`.
 * Automatically unsubscribes when the component is demounted.
 * Make sure that `callback` captures the dependencies by creating one with `useCallback` or pass a fresh function.
 * The hook is parameterized by the type of data it receives.
 *
 * ```
 *  function StatusBar({counterModel}) {
 *    const [status, setStatus] = useState('Counting...')
 *
 *    useSubscribe<number>(
 *      counterModel.id,
 *      'maximumReached',
 *      (maximum) => {setStatus('Maximum reached!')},
 *      [setStatus]
 *    )
 *
 *    return <div>Current Status: {status}</div>
 *  }
 * ``` */
export function useSubscribe<T>(scope: string, eventSpec: string, callback: (data: T) => void): void {
  const croquetView = useCroquetView()
  useEffect(() => {
    if (croquetView === null) return

    croquetView.subscribe(scope, eventSpec, callback)

    // cleanup on component unmount
    return () => {
      if (croquetView !== null) {
        croquetView.unsubscribe(scope, eventSpec)
      }
    }
  }, [scope, eventSpec, callback, croquetView])
}

type UpdateCallback = (time: number) => void
type SyncedCallback = (flag: boolean) => void
type DetachCallback = () => void

let storedSyncedCallback: ((flag: boolean) => void) | null = null

/** Hook that sets up a callback for Croquet.View.update().
 * The function will be called at each simulation cycle.
 */

export function useUpdateCallback(callback: UpdateCallback | null): void {
  const croquetView = useCroquetView()
  if (croquetView !== null) {
    croquetView.updateCallback = callback
  }
}

/** Hook that sets up a callback for Croquet.View.synced().
 * The function will be called when Croquet synced event occurs.
 * ``` */

export function useSyncedCallback(callback: SyncedCallback | null): void {
  const croquetView = useCroquetView()
  if (croquetView !== null) {
    croquetView.syncedCallback = callback
  }
}

/** A function to set up the handler for the synced event. 
 * It is supposed to be called from the React component that 
 * calls createReactSession() in the following manner from where the 

```
setSyncedCallback((flag) => {
    console.log(`synced`, flag)
    if (flag) {
        setCroquetView((old) => session.view)
    }
    session.view.detachCallback = () => {
        console.log(`detached`)
        setCroquetView(null)
    }
})
```
 */

export function setSyncedCallback(func: (flag: boolean) => void) {
  storedSyncedCallback = func
}

/** Hook that sets up a callback for Croquet.View.detach().
 * The function will be called when the root View is detached.
 */

export function useDetachCallback(callback: DetachCallback | null): void {
  const croquetView = useCroquetView()
  if (croquetView !== null) {
    croquetView.detachCallback = callback
  }
}

// our top level view that gets the root model
// and from which we create our one-time-use views per component
class CroquetReactView extends View {
  model: ReactModel
  updateCallback: UpdateCallback | null
  syncedCallback: SyncedCallback | null
  detachCallback: DetachCallback | null

  constructor(model: ReactModel) {
    super(model)
    this.model = model
    this.updateCallback = null
    this.syncedCallback = storedSyncedCallback
    this.detachCallback = null
    this.subscribe(this.viewId, 'synced', this.synced)
  }

  update(time: number) {
    if (this.updateCallback !== null) {
      this.updateCallback(time)
    }
  }

  synced(flag: boolean) {
    // console.log('synced', flag)
    if (this.syncedCallback) {
      this.syncedCallback(flag)
    }
  }

  detach() {
    if (this.detachCallback) {
      this.detachCallback()
    }
    super.detach()
  }
}

/** Main wrapper component that starts and manages a croquet session, enabling child elements to use the
 * {@link usePublish}, {@link useSubscribe}, {@link useObservable}, {@link useViewId} and {@link useModelRoot} hooks.
 *
 * Takes the same parameters as {@link Session.join} except that it doesn't need a root View class,
 * since croquet-react provides a suitable View class behind the scenes.
 *
 * ```
 * function MyApp() {
 *    return (
 *      <InCroquetSession
 *        apiKey='1_123abc',
 *        appId='com.example.myapp'
 *        name='mySession'
 *        password='secret'
 *        model={MyRootModel}
 *        ...
 *      >
 *        // child elements that use hooks go here...
 *      </InCroquetSession>
 *    )
 * }
 * ```
 */
export function InCroquetSession(params: CroquetReactSessionParameters): JSX.Element | null {
  const children = params.children
  const [croquetSession, setCroquetSession] = useState<CroquetSession<CroquetReactView> | undefined>(undefined)
  const [joining, setJoining] = useState<boolean>(false)
  useEffect(() => {
    console.log('InCroquetSession effect')
    setJoining((old) => {
      if (old) {
        return old
      }
      const sessionParams = { ...params, view: CroquetReactView }
      delete sessionParams.children
      console.log('calling Session.join()')
      Session.join({ ...sessionParams }).then(setCroquetSession)
      return true
    })
    return () => {
      // we don't have to reset the session object or such.
      // The same Croquet session should be kept during the life time of the page
      // unless it is explicitly destroyed.
      // console.log('unmount')
    }
  }, [joining, params])

  if (croquetSession) {
    const contextValue = {
      session: croquetSession,
      view: croquetSession.view,
      model: croquetSession.view.model,
    }
    return createElement(CroquetContext.Provider, { value: contextValue }, children)
  }
  return null
}

/** When Croquet is used in a component that is a part of a bigger application,
 * it is sometimes better to establish the Croquet session instance outside,
 * and then pass it in to the Croquet-powered part.

 * ```
 *  const [croquetSession, setCroquetSession] = useState(null)
 *  const [croquetView, setCroquetView] = useState(null)
 *  const calledOnce = useRef(false)
 *  useEffect(() => {
 *    if (!calledOnce.current) {
 *      calledOnce.current = true
 *      const sessionParams = {
 *        name: projectId,
 *        apiKey: import.meta.env.VITE_CROQUET_API_KEY,
 *        tps: 0.5,
 *        appId: import.meta.env.VITE_CROQUET_APP_ID,
 *        password: 'abc',
 *        model: MyCroquetModel,
 *        eventRateLimit: import.meta.env.EVENT_RATE_LIMIT || 60,
 *      }
 *      createCroquetSession(sessionParams as any).then((session) => {
 *        console.log(`session created`)
 *        setCroquetSession(session)
 *        setCroquetView(session.view)
 *        setSyncedCallback((flag) => {
 *           console.log(`synced`, flag)
 *           if (flag) {
 *              setCroquetView((old) => session.view)
 *           }
 *           session.view.detachCallback = (e) => {
 *             console.log(`detached`)
 *             setCroquetView(null)
 *           }
 *        })
 *      })
 *    }
 *  }, [])
 *  return (
 *    <CroquetRoot croquetView={croquetView}>
 *      <MyCroquetComponent/>
 *    </CroquetRoot>
 *   )
```
*/

export function createCroquetSession(params: CroquetReactSessionParameters) {
  const sessionParams = { ...params, view: CroquetReactView }
  return Session.join(sessionParams)
}

/** CroquetRoot component implements the default implementation of the logic described for createCroquetSession function.
 */

type CroquetRootProps = {
  sessionParams: CroquetSessionParameters<Model, CroquetReactView>
  children: JSX.Element | JSX.Element[]
}
export function CroquetRoot({ sessionParams, children }: CroquetRootProps): JSX.Element | null {
  const [croquetSession, setCroquetSession] = useState<CroquetSession<CroquetReactView> | null>(null)
  const [croquetView, setCroquetView] = useState<CroquetReactView | null>(null)
  const [croquetModel, setCroquetModel] = useState<ReactModel | null>(null)

  // Make sure we only create a new session once, even with strict mode
  // const joining = useRef(false)
  const croquetSessionState = useRef<CroquetSession<CroquetReactView> | 'joining' | null>(null)

  // This function updates the state (session, view and model) and subscribes the view
  // to react-upated events to refresh the model state whenever there is a model change.
  function updateState(session: CroquetSession<CroquetReactView>): void {
    const view = session?.view
    const model = view.model

    view.subscribe(session.id, 'react-updated', () => {
      // Here we are creating a shallow copy of model to
      // force react to rerender with the updated data
      setCroquetModel({ ...model } as ReactModel)
    })

    setCroquetSession(session)
    setCroquetView(view)
    setCroquetModel(model)
  }

  useEffect(() => {
    console.log(`----- Running effect -----`)

    async function connect(): Promise<void> {
      // If already connected, do nothing
      if (croquetSessionState.current) {
        console.log(`Already connected...`)
        return
      }

      croquetSessionState.current = 'joining'
      console.log(`+ Creating new session`)
      const session = await createCroquetSession(sessionParams as any)
      croquetSessionState.current = session

      updateState(session)

      console.log(`Session created with view`, session.view)

      setSyncedCallback((flag) => {
        // console.log(`synced`, flag);
        const session = croquetSessionState.current
        if (session !== null && session !== 'joining') {
          if (flag) {
            updateState(session)
          }
          session.view.detachCallback = () => {
            // console.log(`detached`);
            setCroquetView(null)
            setCroquetModel(null)
          }
        }
      })
    }

    connect()

    return () => {
      console.log(`----- Running cleanup -----`)
      if (croquetSessionState.current !== null && croquetSessionState.current !== 'joining') {
        croquetSessionState.current.leave().then(() => console.log('Successfully left session...'))
        croquetSessionState.current = null
      }
    }
  }, [sessionParams])

  console.log('Rendering CroquetRoot component', croquetSession)
  if (croquetView) {
    // It would be nice if we could render the provider like this
    // return (
    //     <CroquetContext.Provider value={contextValue}>
    //         {props.children}
    //     </CroquetContext.Provider>
    // )
    const contextValue = {
      session: croquetSession,
      view: croquetView,
      model: croquetModel,
    }
    return createElement(CroquetContext.Provider, { value: contextValue }, children)
  }
  console.log('croquetView is null, rendering blank...', croquetView)
  return null
}
