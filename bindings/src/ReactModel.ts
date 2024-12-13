import { Model, SubscriptionHandler, FutureHandler } from '@croquet/croquet'

// TODO: import from @croquet/croquet
export interface ViewInfo<T> {
  viewId: string
  viewData?: T
}

export class ReactModel<T = unknown> extends Model {
  __reactEvents: { scope: string; event: string }[] = []
  __views: Map<string, ViewInfo<T>> | null = null

  init(options: any) {
    const { trackViews, ...opts } = options
    super.init(opts)
    this.__reactEvents = []

    // We don't want to track the joined views in every model.
    // the trackViews option enables this behavior
    if (trackViews === true) {
      this.__views = new Map()
    }

    // Subscribe directly via super since we don't need to publish react-updated
    super.subscribe(this.sessionId, 'view-join', this.__viewJoin)
    super.subscribe(this.sessionId, 'view-exit', this.__viewExit)
  }

  // The view-join event provides either a `viewId` string, or if viewData was
  // specified, a ViewInfo<T> object
  private __viewJoin(viewIdOrInfo: string | ViewInfo<T>) {
    const viewInfo: ViewInfo<T> = typeof viewIdOrInfo !== 'string' ? viewIdOrInfo : { viewId: viewIdOrInfo }
    const viewId = viewInfo.viewId

    if (this.__views) {
      this.__views.set(viewId, viewInfo)
      this.publish(this.sessionId, 'views-updated')
    }
    this.handleViewJoin(viewId, viewInfo)
  }

  // The view-exit event provides either a `viewId` string, or if viewData was
  // specified, a ViewInfo<T> object
  private __viewExit(viewIdOrInfo: string | ViewInfo<T>) {
    const viewId = typeof viewIdOrInfo === 'string' ? viewIdOrInfo : viewIdOrInfo.viewId
    const viewInfo = this.__views?.get(viewId) ?? { viewId }

    if (this.__views) {
      this.__views.delete(viewId)
      this.publish(this.sessionId, 'views-updated')
    }
    this.handleViewExit(viewId, viewInfo)
  }

  // Override these methods to add custom handling
  handleViewJoin(viewId: string, viewInfo: ViewInfo<T>) {} // eslint-disable-line @typescript-eslint/no-unused-vars
  handleViewExit(viewId: string, viewInfo: ViewInfo<T>) {} // eslint-disable-line @typescript-eslint/no-unused-vars

  // Public function to assert that users do not subscribe directly to view-join/exit events
  subscribe<T>(scope: string, event: string, handler: SubscriptionHandler<T>): void {
    if (event === 'view-join' || event === 'view-exit') {
      throw new Error(
        `In @croquet/react you cannot directly subscribe to ${event}.\n` +
          `Override ${event === 'view-join' ? 'handleViewJoin' : 'handleViewExit'} instead\n`
      )
    }
    this.__subscribe(scope, event, handler)
  }

  // This function is the one that performs the subscription logic, without performing any checks.
  // It's separate from the one above since we need to directly subscribe to view-join/exit events
  private __subscribe<T>(scope: string, event: string, handler: SubscriptionHandler<T>): void {
    this.__reactEvents.push({ scope, event })

    // normalize handler into string or QFunc
    if (typeof handler === 'function') {
      const model = this as any;
      // if the handler is a method of the model, use the method name
      if (model[handler.name] === handler) handler = handler.name
      // otherwise, we assume that the handler is a QFunc
    }

    // we call the original handler, and then publish a react-updated event
    // We pass as a javascript string to survive minification
    const reactHandler = this.createQFunc<(e: any) => void>({handler}, `(data) => {
      if (typeof handler === 'function') handler(data)
      else this[handler](data)
      this.publish(this.sessionId, 'react-updated')
    }`) 

    super.subscribe(scope, event, reactHandler)
  }

  // Function that helps ReactModel publish a react-updated event
  // every time a future message is executed
  __future_wrapper(methodName: keyof this, ...args: any[]) {
    const value = this[methodName]
    if (typeof value === 'function') {
      value.apply(this, args)
      this.publish(this.sessionId, 'react-updated')
    } else {
      console.error(`${methodName as string} is not a function of ${this}`)
    }
  }

  future<T extends any[]>(tOffset: number, method?: FutureHandler<T>, ...args: T): this {
    // non-proxy case: we schedule the call to a __future_wrapper function
    // that will call method, and then publish a react-updated event
    if (method !== undefined) {
      return super.future(tOffset, '__future_wrapper', method, ...args)
    }

    // We want to allow for the `this.future(tOffset).methodName(...args) syntax
    // To do so, we return a Proxy that invokes this function
    // with all the arguments for the non-proxy case
    return new Proxy(this, {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get(target, prop, _) {
        return (...args: any[]) => target.future(tOffset, prop as string, ...args)
      },
    })
  }
}

ReactModel.register('ReactModel')
