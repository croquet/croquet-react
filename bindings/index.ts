import React, {
    useState,
    useEffect,
    createContext,
    createElement,
    useContext,
    useCallback,
    useMemo,
} from 'react';

import {
    View,
    Session,
    CroquetSession,
    Model,
    CroquetSessionParameters,
} from '@croquet/croquet';

// InCroquetSession parameter is almost the same but omits `view`,
// which is defaulted to CroquetReactView, but adds children
type CroquetReactSessionParameters = Omit<
    CroquetSessionParameters<Model, CroquetReactView>,
    'view'
> & { children: React.ReactNode | React.ReactNode[] };

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
type WatchablePartial<M extends Model> = { [key in WatchableProps<M>]: M[key] };

function watchableProps<M extends Model>(model: M): WatchableProps<M>[] {
    return Object.keys(model).filter(
        (prop) => !builtinModelProps.includes(prop),
    ) as WatchableProps<M>[];
}

function watchablePartial<M extends Model>(model: M): WatchablePartial<M> {
    const partial = {} as WatchablePartial<M>;
    for (const prop of watchableProps(model)) {
        partial[prop] = model[prop];
    }
    return partial;
}

export function useWatchModelRoot<M extends Model>(): M {
    return useWatchModelHelper(useRawModelRoot() as M);
}

export function useWatchModelById<M extends Model>(id: string): M | undefined {
    return useWatchModelHelper(useRawModelById(id) as M | undefined);
}

function useWatchModelHelper<M extends Model>(rawModel: M): M;
function useWatchModelHelper<M extends Model>(
    rawModel: M | undefined,
): M | undefined;
function useWatchModelHelper<M extends Model>(
    rawModel: M | undefined,
): M | undefined {
    const initialWatchablePartial = useMemo(
        () => rawModel && watchablePartial(rawModel as M),
        [rawModel],
    );
    const [lastState, setLastState] = useState(initialWatchablePartial);

    useEffect(() => {
        const handle = requestAnimationFrame(() => {
            if (!rawModel) return;
            if (
                watchableProps(rawModel).some(
                    (prop) => lastState?.[prop] !== rawModel[prop],
                )
            ) {
                setLastState(watchablePartial(rawModel as M));
            }
        });
        return () => {
            cancelAnimationFrame(handle);
        };
    }, [lastState, rawModel]);

    const proxy = useMemo(() => {
        return new Proxy(rawModel as M, {
            get: function (target, prop) {
                if (
                    lastState &&
                    Object.getOwnPropertyDescriptor(lastState, prop)
                ) {
                    return lastState[prop as WatchableProps<M>];
                } else {
                    return target[prop as keyof M];
                }
            },
            set: function (_target, prop) {
                throw new Error(
                    `Can't set model property ${String(
                        prop,
                    )} directly from view`,
                );
            },
        });
    }, [lastState, rawModel]);

    return lastState && proxy;
}

/** Hook that gives access to the raw root Model of this croquet session.
 * Can be used to read Model properties *once* (including other referenced Models),
 * and to publish events to the Model or to subscribe to Model events using the other hooks.
 */
export function useRawModelRoot(): Model {
    const croquetContext = useContext(CroquetContext);
    if (!croquetContext || !croquetContext.view) {
        throw new Error('No Crouqet Session found');
    }
    return croquetContext.view.model;
}

/** Hook that gives access to the Model specified by an id of this croquet session.
 * Can be used to read Model properties *once* (including other referenced Models),
 * and to publish events to the Model or to subscribe to Model events using the other hooks.
 */
export function useRawModelById(id: string): Model | undefined {
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
 * {@link usePublish}, {@link useSubscribe}, {@link useObservable}, {@link useViewId} and {@link useRawModelRoot} hooks.
 *
 * Takes the same parameters as {@link Session.join} except that it doesn't need a root View class,
 * since croquet-react provides a suitable View class behind the scenes.
 *
 * ```
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
 *      </InCroquetSession>
 *    );
 * }
 * ```
 */
export function InCroquetSession(
    params: CroquetReactSessionParameters,
): JSX.Element {
    const children = params.children;

    const sessionParams = useMemo(() => {
        const p = { ...params, view: CroquetReactView };
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
