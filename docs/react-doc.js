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
 * Main wrapper component that manages a croquet sessions, enabling child elements to use the hooks described below.
 * It takes the same parameters as [Session.join](../croquet/Session.html#.join) except that it doesn't need a root View class,
 * since croquet-react provides a suitable View class behind the scenes.
 *
 * @public
 * @param {object} sessionParams The session parameter object that is passed to [Session.join](../croquet/Session.html#.join).
 * If `name` or `password` are undefined at the time of joining a session, random values will be generated
 * @param {boolean} [showChildrenWithoutSession=false] If true, children will be rendered even if there's no active session.
 * @param {boolean} [deferSession=false] If true, the session creation will be deferred.
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
 * Returns whether the component is currently joined to a Croquet session.
 *
 * @public
 * @returns {boolean} True if joined to a Croquet session, false otherwise.
 * @example
 * const isJoined = useIsJoined();
 * if (isJoined) {
 *   console.log("We are connected to a Croquet session");
 * }
 */
export function useIsJoined() {}

/**
 * Returns information about the views currently joined to the Croquet session.
 *
 * @public
 * @returns {Object} An object containing information about joined views.
 *  * `views` - An array of unique identifiers for the joined views.
 *  * `viewCount` - The total number of views currently joined to the session.
 *
 * @example
 * const { views, viewCount } = useJoinedViews();
 * console.log(`There are ${viewCount} views joined to the session.`);
 * console.log('View IDs:', views.join(", "));
 */
export function useJoinedViews() {}

/**
 * Hook that provides a function to leave the current Croquet session.
 * Calling the returned function does not affect the `sessionParams` stored in {@link CroquetRoot}.
 *
 * @public
 * @returns {Function} A function that, when called, will leave the current Croquet session.
 * @example
 * const leaveSession = useLeaveSession();
 * // Later in your code:
 * leaveSession();
 */
export function useLeaveSession() {}

/**
 * Hook that returns a _reference_ to the Model instance with the given id.
 * Keep in mind that even if the model data changes, React will not rerender
 * the components that depend on its data.
 * To achieve this behavior use {@link useReactModelRoot} or {@link useModelSelector} instead.
 *
 * @public
 * @template {M extends ReactModel}
 * @param {string} id - The id of the Model to retrieve.
 * @returns {M | null} The model instance with the given id.
 * Returns `null` if not currently joined to any session, or if an image with the given id was not found
 * 
 * @example
 * const userModel = useModelById<UserModel>('user-123');
 * if (userModel) {
 *   console.log(userModel.name);
 * }
 */
export function useModelById() {}

/**
 * Hook that returns a _reference_ to the root Model instance of the current Croquet session.
 * Keep in mind that even if the model data changes, React will not rerender
 * the components that depend on its data.
 * To achieve this behavior use {@link useReactModelRoot} or {@link useModelSelector} instead.
 *
 * @public
 * @template M
 * @returns {M | null} The root Model instance if available, or null if not.
 * @example
 * const rootModel = useModelRoot<RootModel>();
 * if (rootModel) {
 *   console.log(rootModel.gameState);
 * }
 */
export function useModelRoot() {}

/**
 * Hook that selects and returns a specific part of the Model state.
 * This hook updates state only when the selected data changes, using hashing to detect deep equality.
 * This hook is a good alternative to {@link useReactModelRoot}, since it only
 * re-renders when the subscribed part of the model changes.
 * 
 * The given `selector` function should not return `undefined`.
 *
 * @public
 * @template M, R
 * @param {function(M): R} selector - A function that selects data from the model. The return type of this function will be used as the return type of the hook.
 * @returns {R | null} The selected part of the Model state, or null if there is no current session.
 * @example
 * const playerScore = useModelSelector((model: GameModel) => model.playerScore);
 * if (playerScore !== null) {
 *   console.log(`Current score: ${playerScore}`);
 * }
 */
export function useModelSelector(selector) {}

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
 * A hook to obtain the reactive root model data.
 * 
 * This hook provides access to a React state representation of the root model,
 * ensuring that components depending on it re-render when the model data changes.
 * 
 * Any changes to the model will trigger a re-render of components using this hook.
 * Consider using {@link useModelSelector} for optimized performance.
 * 
 * @public
 * @template T The type of the root model.
 * @returns {T | null} An object mirroring the root model's interface, with the following characteristics:
 *   - Contains all properties of the root model.
 *   - Includes methods corresponding to each event the model is subscribed to.
 * Calling such methods will publish the respective event.
 *   - If a property name conflicts with a subscribed event name, the property value takes precedence.
 *   - Returns `null` if there is no active Croquet session.
 * 
 * 
 * @example
 * // Using the hook
 * const model = useReactModelRoot<RootModel>();
 * 
 * if (model) {
 *   // Accessing model properties
 *   console.log(model.property1);
 * 
 *   // Publishing events
 *   model.event1();
 *   model.event2(eventData);
 * } else {
 *   console.log('No active Croquet session');
 * }
 */
export function useReactModelRoot() {}

/**
 * Hook that returns the current Croquet session.
 *
 * @public
 * @template M
 * @returns {CroquetSession<CroquetReactView<M>> | null} The current Croquet session, or null if not in a session.
 * @example
 * const session = useSession<GameModel>();
 * if (session) {
 *   console.log(`Connected to session: ${session.id}`);
 * }
 */
export function useSession() {}

/**
 * Hook that returns the ID of the current Croquet session.
 *
 * @public
 * @returns {string | null} The ID of the current session, or null if not in a session.
 * @example
 * const sessionId = useSessionId();
 * console.log(sessionId ? `Current session: ${sessionId}` : 'Not in a session');
 */
export function useSessionId() {}

/**
 * Hook that gives access to the `sessionParams` object stored in the {@link CroquetRoot} state.
 *
 * @public
 * @returns {Object} The `sessionParams` object, which can be:
 *   1. If currently joined to a Croquet session: The parameters used in the active [Session.join](../croquet/Session.html#.join) call.
 *   2. If not currently in a session, but previously joined: The parameters from the last joined session.
 *   3. If never joined a session: The initial parameters passed to {@link CroquetRoot}.
 * 
 * @example
 * const sessionParams = useSessionParams();
 * console.log('Current session name:', sessionParams.name);
 * console.log('Application ID:', sessionParams.appId);
 * 
 */
export function useSessionParams() {}

/**
 * Hook that provides a function to join a new Session
 * 
 * The returned function:
 * - Accepts an object with override values for the `sessionParameters` object.
 * - Applies these overrides to the existing `sessionParameters` in {@link CroquetRoot} state.
 * - Automatically generates random strings for `name` and `password` if they are null or undefined after applying overrides.
 * 
 * If the returned function is called when joined to a session, it leaves the previous session.
 *
 * @public
 * @returns {Function} A function to join a new Croquet Session.
 *
 * @example
 * const setSession = useSetSession();
 * // Later in your code:
 * setSession({name: 'new-name', password: 'password'});
 */
export function useSetSession() {}

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

/**
 * Hook that provides access to the current Croquet React View.
 *
 * @public
 * @template M
 * @returns {CroquetReactView<M> | null} The current Croquet React View, or null if not available.
 * @example
 * const view = useView<GameView>();
 * if (view) {
 *   console.log(`Current view ID: ${view.viewId}`);
 * }
 */
export function useView() {}

/**
 * A hook to obtain the current viewId. Returns `null` if not joined to any session
 *
 * @public
 * @returns {string | null}
 * @example
 * const myViewId: string = useViewId();
 */
export function useViewId() {}






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

/**
 * @public
 * @deprecated since version 2.2.0. Alias for {@link useJoinedViews}. Use that hook instead.
 * @function
 * @name useConnectedViews
 */
export const useConnectedViews = useJoinedViews;

/**
 * @public
 * @deprecated since version 2.2.0. Alias for {@link useSession}. Use that hook instead.
 * @function
 * @name useCroquetSession
 */
export const useCroquetSession = useSession;

/**
 * @public
 * @deprecated since version 2.2.0. Alias for {@link useView}. Use that hook instead.
 * @function
 * @name useCroquetView
 */
export const useCroquetView = useView;
