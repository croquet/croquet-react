/**
  The react context to store the object returned from Session.join(). You can obtrain the value by calling `useContext(CroquetContext)`. You can access useful values such as view, model, etc. from the value of this context.

@public
@example
const croquetContext = useContext(CroquetContext);
if (!croquetContext) {return <div/>;}

*/

let CroquetContext = {};

/**
A hook to obtain the viewId.

@public

@type {object}

@example
const myViewId:string = useViewId();

*/

export function useViewId() {}


/** 
A hook to obtain the root model object.

@public
@example
const model = useModelRoot();
*/

export function useModelRoot() {}

/** 
A hook to obtain a sub model object.
@public
@returns {"T extends Model"} the model object with id
@example
const submodel = useModelRoot(rootModel.someData.id);

*/

export function useModelById(id) {}

/** 
A hook to create a function that publishes a view event.

@public
@example
const publishRelease = usePublish<GrabData>((id) => 
  [model.id, 'release', {viewId: myViewId, id}]);
*/

export function usePublish(callback) {}

/**
A hook to set up a subscription to a Croquet message

@public
@example
useSubscribe<GrabData>(model.id, "grabbed", grabBall);

*/

export function useSubscribe(scope, eventSpec, callback) {}


/** Hook that sets up a callback for Croquet.View.update().
 * The function will be called at each simulation cycle.

@public
@example
useUpdateCallback((update:time:number) => void);

 */

export function useUpdateCallback(callback) {}

/** Hook that sets up a callback for Croquet.View.synced().
 * The function will be called when Croquet synced event occurs.
@public
@example
useSyncedCallback(synced:() => void);
*/

export function useSyncedCallback(callback) {}

/** Hook that sets up a callback for Croquet.View.detach().
 * The function will be called when the root View is detached.

@public
@example
useDetachCallback(detach:() => void);
 */

export function useDetachCallback(callback) {}

/** Main wrapper component that starts and manages a croquet session, enabling child elements to use the
 * {@link usePublish}, {@link useSubscribe}, {@link useObservable}, {@link useViewId} and {@link useModelRoot} hooks.
 *
 * Takes the same parameters as {@link Session.join} except that it doesn't need a root View class,
 * since croquet-react provides a suitable View class behind the scenes.

@public
 *
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
