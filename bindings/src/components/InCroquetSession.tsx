import { useEffect, useState, createElement } from 'react'
import { Session, CroquetSession } from '@croquet/croquet'
import { CroquetReactView } from '../CroquetReactView'
import { CroquetContext } from './CroquetContext'
import { CroquetReactSessionParameters } from '../createCroquetSession'
import { ReactModel } from '../ReactModel'

// InCroquetSession parameter is almost the same but omits `view`,
// which is defaulted to CroquetReactView, but adds children
type InCroquetSessionProps<M extends ReactModel> = CroquetReactSessionParameters<M> & {
  children: React.ReactNode | React.ReactNode[]
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
export function InCroquetSession<M extends ReactModel>(params: InCroquetSessionProps<M>): JSX.Element | null {
  const children = params.children
  const [croquetSession, setCroquetSession] = useState<CroquetSession<CroquetReactView<M>> | undefined>(undefined)
  const [joining, setJoining] = useState<boolean>(false)
  useEffect(() => {
    console.log('InCroquetSession effect')
    setJoining((old) => {
      if (old) return old
      const sessionParams = { ...params, view: CroquetReactView<M> }
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
      changeSession: () => {},
      leaveSession: () => {}
    }
    return createElement(CroquetContext.Provider, { value: contextValue }, children)
  }
  return null
}
