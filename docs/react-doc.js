/**
 * This class extends the Croquet [Model](../croquet/Model.html) class to automatically
 * update React state when the model changes.
 *
 * We recommend that your models inherit from this class, as it requires less code,
 * but you can still use the Model class. Keep in mind that if you do, you won't be able
 * to use the {@link useReactModelRoot} hook, and will have to publish and subscribe to the input and output events on your own.
 * For more details about this, please check the [Event overview](croquet/index.html#events) and the
 * [View.publish](../croquet/View.html#publish), [Model.subscribe](../croquet/Model.html#subscribe),
 * [Model.publish](../croquet/Model.html#publish), and [View.subscribe](../croquet/View.html#subscribe) methods.
 *
 * @class
 * @public
 * @extends Model
 */
class ReactModel {
  /**
   * This method is called whenever the ReactModel receives a [view-join](../croquet/global.html#event:view-join) event.
   * @param {string} viewId - The id of the view that just connected
   * @return {void}
   * @public
   */
  handleViewJoin(viewId) {}

  /**
   * This method is called whenever the ReactModel receives a [view-exit](../croquet/global.html#event:view-exit) event.
   * @param {string} viewId - The id of the view that just left
   * @return {void}
   * @public
   */
  handleViewExit(viewId) {}
}

/**
 * The react context to store the `CroquetReactView` instance.
 * You can obtain the value by calling `useContext(CroquetContext)`.
 * You can access useful values such as view, model, etc. from the value of this context.
 *
 * @public
 * @example
 * const croquetView = useContext(CroquetContext);
 * const model = croquetView.model;
 */
let CroquetContext = {};

/**
 * Main wrapper component that starts and manages a croquet session, enabling child elements to use the hooks described below.
 * It takes the same parameters as [Session.join](../croquet/Session.html#.join) except that it doesn't need a root View class,
 * since croquet-react provides a suitable View class behind the scenes.
 *
 * @public
 * @argument {object} sessionParams The session parameter object that is passed to [Session.join](../croquet/Session.html#.join).
 * @returns - A React component
 * @example
 * function CounterApp() {
 *   return (
 *     <CroquetRoot
 *       sessionParams={{
 *         name: import.meta.env["VITE_CROQUET_NAME"],
 *         password: import.meta.env["VITE_CROQUET_PASSWORD"],
 *         appId: import.meta.env["VITE_CROQUET_APP_ID"],
 *         apiKey: import.meta.env["VITE_CROQUET_API_KEY"],
 *         model: CounterModel,
 *       }}
 *     >
 *       <p>Your application here</p>
 *     </CroquetRoot>
 *   );
 * }
 */
export function CroquetRoot(props) {}

/**
 * A hook to obtain the viewId.
 *
 * @public
 * @returns {string}
 * @example
 * const myViewId: string = useViewId();
 */
export function useViewId() {}

/**
 * A hook to obtain the sessionid.
 * 
 * @public
 * @returns {string}
 * @example
 * const sessionId: string = useSessionId();
 */
export function useSessionId() {}

/**
 * This hook returns a function that allows components within the {@link CroquetRoot} context to connect to a new session.
 * 
 * @public
 * @returns {function} The returned function accepts a single parameter with the following properties:
 *  - **name**: `string` - The name of the new session.
 *  - **password**?: `string` | `undefined` - (_Optional_) The password for accessing the new session, if required.
 * @example
 * // Usage example:
 * const changeSession = useChangeSession();
 * changeSession({ name: 'new-session', password: 'password' });
 */
export function useChangeSession() {}

/** 
 * A hook to obtain the root model data.
 * This data comes from a React state, meaning that any change to the
 * model data will cause the components that depend on it to be rerendered.
 * 
 * To use this hook, the application **models must inherit from {@link ReactModel}**
 * 
 * @public
 * @returns {object} An object containing the same properties as the root model object.
 * Additionally, it has one method for each event the model is subscribed to.
 * Calling those methods will broadcast the respective event.
 * 
 * If the model has a property with the same name as one of the events it is subscribed to,
 * the returned object will have the property value.
 * 
 * @example
 * // Any changes to the model will trigger a rerender
 * const model = useReactModelRoot<RootModel>();
 * 
 * // access model properties
 * const prop1 = model.property1
 * 
 * // publish an event this model is subscribed to
 * model.event1()
 * model.event2(event2Data)
 */
export function useReactModelRoot() {}

/** 
 * A hook to obtain the root model object.
 * Keep in mind that even if the model data changes, React will not rerender
 * the components that depend on it.
 * To achieve this behavior use {@link useReactModelRoot} instead.
 * 
 * @public
 * @returns {Model} The instance of a subclass of Model used as the root Model.
 * @example
 * const model = useModelRoot();
 */
export function useModelRoot() {}

/**
 * A hook to obtain a sub model object.
 * @public
 * @argument {number} id The id of the model to retrieve
 * @returns {Model} The instance of a subclass of Model with the given id.
 * @example
 * const submodel = useModelById(rootModel.someData.id);
 */
export function useModelById(id) {}

/**
 * A hook for generating a function that publishes a view event.
 *
 * The callback function provided takes one argument, `data`, and returns an array
 * containing three elements that describe the event to be published:
 *
 * 1. The scope to which the event is being emitted.
 * 2. The name of the event.
 * 3. The data attached to the event.
 *
 * The `data` argument corresponds to the value passed to the function returned by this hook.
 *
 * @public
 * @template T The type of data being published.
 * @param {function(string): T} callback The callback function used to construct the event data.
 * @returns {function(): void} The function to be used to publish the event.
 * @example
 *
 * type GrabData = { viewId: string, id: string };
 *
 * const publishRelease = usePublish<GrabData>(
 *  (data) => [model.id, 'release', data]
 * );
 *
 * // Call the generated function to publish the 'release' event with specific data
 * publishRelease({ viewId: myViewId, id });
 */
export function usePublish(callback) {}

/**
 * A hook to set up a subscription to a Croquet message.
 *
 * @public
 * @template T The type of data being received
 * @param {string} scope The scope in which we are subscribing to the event
 * @param {string} eventSpec The name of the event we are subscribing to
 * @param {function(T): void} callback The function to be called when the event is received
 * @example
 * function grabBall(data:GrabData): void  {
 *  // Callback logic here
 * }
 * useSubscribe<GrabData>(model.id, "grabbed", grabBall);
 *
 */
export function useSubscribe(scope, eventSpec, callback) {}

/** Hook that sets up a callback for Croquet.View.update().
 * The callback function is called at each simulation cycle.
 *
 * @public
 * @param {function(): void} callback The function to be called at each simulation cycle
 * @example
 * useUpdateCallback((update_time: number) => console.log(`Updated at ${update_time}!`));
 *
 */
export function useUpdateCallback(callback) {}

/** Hook that sets up a callback for Croquet.View.synced().
 * The callback function is called when a Croquet synced event occurs.
 * @public
 * @param {function(): void} callback The function to be called when a `synced` event occurs
 * @example
 *
 * function onSynced(): void  {
 *  // Callback logic here
 * }
 * useSyncedCallback(onSynced);
 */
export function useSyncedCallback(callback) {}

/** Hook that sets up a callback for Croquet.View.detach().
 * The callback function is called when the root View is detached.
 * @public
 * @param {function(): void} callback The function to be called when the root View is detached
 * @example
 * function onDetached(): void  {
 *  // Callback logic here
 * }
 * useDetachCallback(onDetached);
 */
export function useDetachCallback(callback) {}

/**
 * Main wrapper component that starts and manages a croquet session, enabling child elements to use the hooks described above.
 * It takes the same parameters as [Session.join](../croquet/Session.html#.join) except that it doesn't need a root View class,
 * since croquet-react provides a suitable View class behind the scenes.
 *
 * @public
 * @deprecated Use {@link CroquetRoot} instead.
 * @example
 * function MyApp() {
 *    return (
 *      <InCroquetSession
 *        apiKey="1_123abc",
 *        appId="com.example.myapp"
 *        name="mySession"
 *        password="secret"
 *        model={MyRootModel}
 *         ...
 *      >
 *        // child elements that use hooks go here...
 *        <MyComponent/>
 *      </InCroquetSession>
 *    );
 * }
 */
export function InCroquetSession(params) {}

/**
 * When Croquet is used in a component that is a part of a bigger application, it is sometimes better
 * to establish the Croquet session instance outside,and then pass it in to the Croquet-powered part.
 *
 * @public
 * @deprecated Use {@link CroquetRoot} instead.
 * @returns - the Croquet session object.
 * @example
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
