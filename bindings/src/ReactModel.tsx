import { Model } from '@croquet/croquet'

export class ReactModel extends Model {
  __reactEvents: { scope: string; event: string }[] = []
  __views: Set<string> | null = null

  init(options: any) {
    const { trackViews, ...opts } = options
    super.init(opts)
    this.__reactEvents = []

    // We don't want to track the connected views in every model.
    // the trackViews option enables this behavior
    if (trackViews === true) this.__views = new Set()
    this.__subscribe(this.sessionId, 'view-join', this.__viewJoin)
    this.__subscribe(this.sessionId, 'view-exit', this.__viewExit)
  }

  private __viewJoin(viewId: string) {
    if (this.__views) {
      this.__views.add(viewId)
      this.publish(this.sessionId, 'views-updated')
    }
    this.handleViewJoin(viewId)
  }
  private __viewExit(viewId: string) {
    if (this.__views) {
      this.__views.delete(viewId)
      this.publish(this.sessionId, 'views-updated')
    }
    this.handleViewExit(viewId)
  }

  // Override these methods to add custom handling
  handleViewJoin(viewId: string) {} // eslint-disable-line @typescript-eslint/no-unused-vars
  handleViewExit(viewId: string) {} // eslint-disable-line @typescript-eslint/no-unused-vars

  // Public function to assert that users do not subscribe directly to view-join/exit events
  subscribe<T>(scope: string, event: string, methodName: string | ((e: T) => void)): void {
    if (event === 'view-join' || event === 'view-exit') {
      throw new Error(
        `In @croquet/react you cannot directly subscribe to ${event}.\n` +
          `Override ${event === 'view-join' ? 'handleViewJoin(viewId)' : 'handleViewExit(viewId)'} instead\n`
      )
    }
    this.__subscribe(scope, event, methodName)
  }

  // This function is the one that performs the subscription logic, without performing any checks.
  // It's separate from the one above since we need to directly subscribe to view-join/exit events
  private __subscribe<T>(scope: string, event: string, methodName: string | ((e: T) => void)): void {
    this.__reactEvents.push({ scope, event })

    if (typeof methodName === 'function') {
      methodName = methodName.name
    }

    // This is a hacky (and maybe dubious) way to add
    // custom logic after the original Model handler
    // is called. We generate a function that inlines the handler's
    // methodName and calls it, before publishing the "react-updated"
    // event. That function will be used by a (yet) undocumented
    // feature of Croquet that allows you to pass a function
    // instead of a method. It will stringify the function (because
    // subscription handlers need to be snapshottable) which is why
    // it can't directly access the methodName variable of this method.

    // this function will receive a single argument: data
    const func = new Function(
      'data',
      `this.${methodName}(data);this.publish(this.sessionId,'react-updated')`
    ) as (data: T) => void;

    super.subscribe(scope, event, func)
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

  future(tOffset?: number | undefined, methodName?: string | undefined, ...args: any[]): this {
    // non-proxy case: we schedule the call to a __future_wrapper function
    // that will call methodName, and then publish a react-updated event
    if (methodName !== undefined) {
      return super.future(tOffset, '__future_wrapper', methodName, ...args)
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
