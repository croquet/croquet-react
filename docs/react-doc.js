/**
  The react context to store the object returned from Session.join(). You can obtrain the value by calling `useContext(CroquetContext)`. You can access useful values such as view, model, etc. from the value of this context.

@public
@example
const croquetContext = useContext(CroquetContext);
const sessionId = croquetContext.id;

*/

let CroquetContext = {};

/**
A hook to obtain the viewId.

@public
@returns {string}
@example
const myViewId:string = useViewId();

*/

export function useViewId() {}

/**
A hook to obtain the sessionid.

@public
@returns {string}
@example
const sessionId:string = useSessionId();
 */
export function useSessionId() {}

/** 
A hook to obtain the root model object.

@public
@returns {Model} - The instance of a subclass of Model used as the root Model.
@example
const model = useModelRoot();
*/

export function useModelRoot() {}

/** 
A hook to obtain a sub model object.
@public
@returns {Model} the model object of a subclass of Model with id.
@example
const submodel = useModelRoot(rootModel.someData.id);

*/

export function useModelById(id) {}

/** 
A hook to create a function that publishes a view event.

@public
@example
type GrabData = {viewId:string, id:string};
const publishRelease = usePublish<GrabData>((id) => 
  [model.id, 'release', {viewId: myViewId, id}]);
*/

export function usePublish(callback) {}

/**
A hook to set up a subscription to a Croquet message.

@public
@example
function grabBall(data:GrabData):void  {}
useSubscribe<GrabData>(model.id, "grabbed", grabBall);

*/

export function useSubscribe(scope, eventSpec, callback) {}

/** Hook that sets up a callback for Croquet.View.update().
 * The callback function is called at each simulation cycle.

@public
@example
useUpdateCallback((update:time:number) => void);

 */

export function useUpdateCallback(callback) {}

/** Hook that sets up a callback for Croquet.View.synced().
 * The callback function is called when a Croquet synced event occurs.
@public
@example
useSyncedCallback(synced:() => void);
*/

export function useSyncedCallback(callback) {}

/** Hook that sets up a callback for Croquet.View.detach().
 * The callback function is called when the root View is detached.

@public
@example
useDetachCallback(detach:() => void);
 */

export function useDetachCallback(callback) {}

/** Main wrapper component that starts and manages a croquet session, enabling child elements to use the hooks described above.
 *
 * It takes the same parameters as {@link Session.join} except that it doesn't need a root View class,
 * since croquet-react provides a suitable View class behind the scenes.

@public
@example
 * function MyApp() {
 *    return (
 *      <InCroquetSession
 *        apiKey="1_123abc",
 *        appId="com.example.myapp"
 *        name="mySession"
 *        password="secret"
 *        model={MyRootModel}
          ...
 *      >
 *        // child elements that use hooks go here...
 *        <MyComponent/>
 *      </InCroquetSession>
 *    );
 * }
 */
export function InCroquetSession(params) {}

/** When Croquet is used in a component that is a part of a bigger application, it is sometimes better to establish the Croquet session instance outside, and then pass it in to the Croquet-powered part.
@public
@returns - the Croquet session object.

@example
 * const [croquetSession, setCroquetSession] = useState(null);
 * const calledOnce = useRef(false);
 * useEffect(() => {
 *   if (!calledOnce.current) {
 *     calledOnce.current = true;
 *     const sessionParams = {
 *       name: projectId,
 *       apiKey: import.meta.env.VITE_CROQUET_API_KEY,
 *       tps: 0.5,
 *       appId: import.meta.env.VITE_CROQUET_APP_ID,
 *       password: "abc",
 *       model: MyCroquetModel,
 *       eventRateLimit: import.meta.env.EVENT_RATE_LIMIT || 60,
 *     };
 *     createCroquetSession(sessionParams as any).then((session) => {
 *       console.log(`session created`);
 *       setCroquetSession(session);
 *     });
 *   }
 * }, [...]);
 * return (
 *   <CroquetRoot session={croquetSession}>
 *     <MyCroquetComponent/>
 *   </CroquetRoot>
 * );
*/

export function createCroquetSession(params) {}
export function CroquetRoot(props) {}
