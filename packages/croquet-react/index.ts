import React, {
    useState,
    useEffect,
    createContext,
    createElement,
    useContext,
    useCallback,
    useMemo,
    useRef,
} from 'react';

import {
    View,
    Session,
    CroquetSession,
    Model,
    CroquetSessionParameters,
    App,
} from '@croquet/croquet';

import deepEqual from 'fast-deep-equal';
import clone from 'clone';

// InCroquetSession parameter is almost the same but omits `view`,
// which is defaulted to CroquetReactView, but adds children
type CroquetReactSessionParameters = Omit<
    CroquetSessionParameters<Model, CroquetReactView>,
    'view' | 'name' | 'password'
> & {
    name?: CroquetSessionParameters<any, any>['name'],
    password?: CroquetSessionParameters<any, any>['password'],
    children: React.ReactNode | React.ReactNode[]
};

// A React context that stores the croquet session
// Provided by `InCroquetSession`, consumed by all the hooks.
export const CroquetContext = createContext<
    CroquetSession<CroquetReactView> | undefined
>(undefined);

/** Hook that gives access to the id of the client. This can be used as an identifier for different clients.
 */
export function useViewId(): string {
    const croquetContext = useContext(CroquetContext);
    if (!croquetContext || !croquetContext.view) {
        throw new Error('No Crouqet Session found');
    }
    return croquetContext.view.viewId;
}

/** Hook that gives access to the sessionId.
 */
export function useSessionId(): string {
    const croquetContext = useContext(CroquetContext);
    if (!croquetContext || !croquetContext.view) {
        throw new Error('No Crouqet Session found');
    }
    return croquetContext.id;
}

const builtinModelProps = Object.keys(Model.prototype);

type WatchableProps<M extends Model> = Exclude<keyof M, keyof Model>;

function watchableProps<M extends Model>(model: M): WatchableProps<M>[] {
    return Object.keys(model).filter(
        (prop) => !builtinModelProps.includes(prop),
    ) as WatchableProps<M>[];
}

type PublishProxy<M extends Model> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in keyof M as M[K] extends Function ? (K extends keyof Model ? never : K) : never]: M[K]
}

type ModelWithChanger<M extends Model> = M & {change: PublishProxy<M>}

function publishProxyHandler<M extends Model>(modelId: typeof Model.prototype.id, publish: typeof View.prototype.publish): ProxyHandler<M> {
    return {
        get(_target, method, _) {
            if (typeof method === 'string') {
                return function(arg: any) {
                    publish(modelId, method, arg);
                }
            }
        }
    }
}

/** Hook that rerenders the calling component whenever properties of a Model change.
 *
 *  Use it around the `useModelRoot` or `useModelById` hooks like so:
 *
 *  ```const model = useModelState(useModelRoot());```
 *
 *  or around a sub-Model reference:
 *
 *  ```const child = useModelState(parent.child);```
 *
 *  This hook does one deep property comparison per frame to check if rerendering is necessary.
 *  The perforance overhead of this should be negligible in most cases, but if it turns out to be a bottleneck,
 *  consider instead using `useSubscribe` to only rerender on certain events.
 */
// TODO: handle passing in already watched model
export function useModelState<M extends Model>(model: M): ModelWithChanger<M>;
export function useModelState<M extends Model>(
    model: M | undefined,
): ModelWithChanger<M> | undefined;
export function useModelState<M extends Model>(
    model: M | undefined,
): ModelWithChanger<M> | undefined {
    const context = useContext(CroquetContext);
    const initialModel = useMemo(() => clone(model), [model]);
    const [lastState, setLastState] = useState(initialModel);

    const modelWithChanger = useMemo<ModelWithChanger<M> | undefined>(
        () =>
            context?.view &&
            lastState && {
                ...lastState,
                get change() {
                    return new Proxy(
                        lastState,
                        publishProxyHandler(
                            lastState.id,
                            context.view.publish.bind(context.view),
                        ),
                    ) as PublishProxy<M>;
                },
            },
        [context?.view, lastState],
    );

    const onFrameHandle = useRef<number>();

    useEffect(() => {
        const onFrame = () => {
            if (!model) return;
            if (
                watchableProps(model).some((prop) => {
                    if (model[prop] instanceof Model) {
                        return lastState?.[prop] !== model[prop];
                    } else {
                        return !deepEqual(lastState?.[prop], model[prop]);
                    }
                })
            ) {
                setLastState(clone(model));
            }
            onFrameHandle.current = requestAnimationFrame(onFrame);
        };
        onFrameHandle.current = requestAnimationFrame(onFrame);
        return () => {
            onFrameHandle.current &&
                cancelAnimationFrame(onFrameHandle.current);
        };
    }, [lastState, model]);

    return modelWithChanger;
}

/** Hook that gives access to the raw root Model of this croquet session.
 * Can be used to read the current Model properties *once* (including other referenced Models),
 * and to publish events to the Model or to subscribe to Model events using the other hooks.
 *
 * To rerender whenever Model properties change, wrap this hook additionally with the `useModelState` hook.
 */
export function useModelRoot<M extends Model>(): M {
    const croquetContext = useContext(CroquetContext);
    if (!croquetContext || !croquetContext.view) {
        throw new Error('No Crouqet Session found');
    }
    return croquetContext.view.model as M;
}

/** Hook that gives access to the Model specified by an id of this croquet session.
 * Can be used to read the current Model properties *once* (including other referenced Models),
 * and to publish events to the Model or to subscribe to Model events using the other hooks.
 *
 * To rerender whenever Model properties change, wrap this hook additionally with the `useModelState` hook.
 */
export function useModelById<M extends Model>(id: string): M | undefined {
    const croquetContext = useContext(CroquetContext);
    if (!croquetContext || !croquetContext.view) {
        throw new Error('No Crouqet Session found');
    }
    return croquetContext.view.model.getModel(id);
}

/** Hook that returns a function that will have an event publishing effect.
 * Needs to be provided with a `publishCallback` that determines the event and data to be published,
 * by either returning `[scope, event, data]` or just `[scope, event]`.
 * Any arguments passed to the function returned by the hook will be forwarded to `publishCallback` as-is.
 * Make sure that the callback function captures all its dependencies by creating one with useCallback, or pass a fresh function.
 *
 * The hook is parameterized by the type of data it publishes. You can provide the same type for usePublish and subscribe on the model side to ensure the types are consistent.
 *
 * A simple example:
 * ```
 * function IncrementCounterButton({counterModel}) {
 *    const publishIncrement = usePublish<number>(
 *      () => [counterModel.id, 'increment', 1]
 *    );
 *
 *    return <button onClick={publishIncrement} value="Increment"/>;
 * }
 * ```
 *
 * Forwarding arguments:
 * ```
 * function IncrementCounterBy10Button({counterModel}) {
 *    const publishIncrement = usePublish<number>(
 *      (incrementBy) => [counterModel.id, 'increment', incrementBy]);
 *
 *    return <button onClick={() => publishIncrement(10)} value="Increment by 10"/>;
 * }
 * ```
 */
export function usePublish<T>(
    publishCallback: (...args: any[]) => [string, string] | [string, string, T],
): (...args: any[]) => T | undefined {
    const croquetContext = useContext(CroquetContext);
    return useCallback(
        (...args) => {
            if (!croquetContext || !croquetContext.view) {
                throw new Error('No Crouqet Session found');
            }
            const result = publishCallback(...args);
            let ret: T | undefined;
            if (result && result.length >= 2) {
                const [scope, event, data] = result;
                croquetContext.view.publish(scope, event, data);
                ret = data;
            }
            return ret;
        },
        // deps are not in play here as publishCallback has to be fresh to capture what it depnds on
        [publishCallback, croquetContext],
    );
}

/** Hook that listens to events matching the provided `scope` and `eventSpec`.
 * Event data is passed as an argument to `callback`.
 * Automatically unsubscribes when the component is demounted.
 * Make sure that `callback` captures the dependencies by creating one with `useCallback` or pass a fresh function.
 * The hook is parameterized by the type of data it receives.
 *
 * ```
 *  function StatusBar({counterModel}) {
 *    const [status, setStatus] = useState("Counting...");
 *
 *    useSubscribe<number>(
 *      counterModel.id,
 *      "maximumReached",
 *      (maximum) => {setStatus("Maximum reached!")},
 *      [setStatus]
 *    );
 *
 *    return <div>Current Status: {status}</div>;
 *  }
 * ``` */
export function useSubscribe<T>(
    scope: string,
    eventSpec: string,
    callback: (data: T) => void,
): void {
    const croquetContext = useContext(CroquetContext);
    useEffect(() => {
        if (!croquetContext || !croquetContext.view) {
            throw new Error('No Crouqet Session found');
        }
        croquetContext.view.subscribe(scope, eventSpec, callback);
        // cleanup on component unmount
        return () => {
            if (!croquetContext || !croquetContext.view) {
                throw new Error('No Crouqet Session found');
            }
            croquetContext.view.unsubscribe(scope, eventSpec);
        };
    }, [scope, eventSpec, callback, croquetContext]);
}

type UpdateCallback = (time: number) => void;
type SyncedCallback = (flag: boolean) => void;
type DetachCallback = () => void;

/** Hook that sets up a callback for Croquet.View.update().
 * The function will be called at each simulation cycle.
 */

export function useUpdateCallback(callback: UpdateCallback | null): void {
    const croquetContext = useContext(CroquetContext);
    if (!croquetContext || !croquetContext.view) {
        throw new Error('No Crouqet Session found');
    }
    croquetContext.view.updateCallback = callback;
}

/** Hook that sets up a callback for Croquet.View.synced().
 * The function will be called when Croquet synced event occurs.
 * ``` */

export function useSyncedCallback(callback: SyncedCallback | null): void {
    const croquetContext = useContext(CroquetContext);
    if (!croquetContext || !croquetContext.view) {
        throw new Error('No Crouqet Session found');
    }
    croquetContext.view.syncedCallback = callback;
}

/** Hook that sets up a callback for Croquet.View.detach().
 * The function will be called when the root View is detached.
 */

export function useDetachCallback(callback: DetachCallback | null): void {
    const croquetContext = useContext(CroquetContext);
    if (!croquetContext || !croquetContext.view) {
        throw new Error('No Crouqet Session found');
    }
    croquetContext.view.detachCallback = callback;
}

// our top level view that gets the root model
// and from which we create our one-time-use views per component
class CroquetReactView extends View {
    model: Model;
    updateCallback: UpdateCallback | null;
    syncedCallback: SyncedCallback | null;
    detachCallback: DetachCallback | null;

    constructor(model: Model) {
        super(model);
        this.model = model;
        this.updateCallback = null;
        this.syncedCallback = null;
        this.detachCallback = null;
        this.subscribe(this.viewId, 'synced', this.synced);
    }

    update(time: number) {
        if (this.updateCallback !== null) {
            this.updateCallback(time);
        }
    }

    synced(flag: boolean) {
        if (this.syncedCallback) {
            this.syncedCallback(flag);
        }
    }

    detach() {
        if (this.detachCallback) {
            this.detachCallback();
        }
        super.detach();
    }
}

/** Main wrapper component that starts and manages a croquet session, enabling child elements to use the
 * {@link usePublish}, {@link useSubscribe}, {@link useObservable}, {@link useViewId} and {@link useModelRoot} hooks.
 *
 * Takes the same parameters as {@link Session.join} except that it doesn't need a root View class,
 * since croquet-react provides a suitable View class behind the scenes.
 *
 * Defaults to using autoSession (room name based on appId) and autoPassword, although these can be set explicitly as well
 *
 * ```
 * function MyApp() {
 *    return (
 *      <InCroquetSession
 *        apiKey="1_123abc",
 *        appId="com.example.myapp"
 *        model={MyRootModel}
          ...
 *      >
 *        // child elements that use hooks go here...
 *      </InCroquetSession>
 *    );
 * }
 * ```
 */
export function InCroquetSession(
    params: CroquetReactSessionParameters,
): JSX.Element {
    // TODO: deal with dormant tabs / leaving
    const children = params.children;

    const sessionParams = useMemo(() => {
        const p = {
            ...params,
            name: params.name || App.autoSession(params.appId),
            password: params.password || App.autoPassword(),
            view: CroquetReactView,
        };
        delete p.children;
        return p;
    }, [params]);

    const [croquetContext, setCroquetContext] = useState<
        CroquetSession<CroquetReactView> | undefined
    >(undefined);
    useEffect(() => {
        let session: CroquetSession<View> | null = null;
        Session.join(sessionParams).then((context) => {
            session = context;
            setCroquetContext(context);
        });
        return () => {
            if (session) {
                session.leave();
                session = null;
            }
        };
    }, [sessionParams]);

    if (croquetContext) {
        return createElement(
            CroquetContext.Provider,
            { value: croquetContext },
            children,
        );
    } else {
        return createElement('div');
    }
}
