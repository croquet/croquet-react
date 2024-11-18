import { Session, CroquetSessionParameters } from '@croquet/croquet'
import { CroquetReactView } from './CroquetReactView'
import { ReactModel } from './ReactModel'

export interface CroquetReactSessionParameters<M extends ReactModel>
  extends Omit<CroquetSessionParameters<M, CroquetReactView<M>>, 'view'> {}

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
export async function createCroquetSession<M extends ReactModel>(params: CroquetReactSessionParameters<M>) {
  const sessionParams = { ...params, view: CroquetReactView<M>, flags: [ 'react' ] }
  return Session.join(sessionParams)
}
