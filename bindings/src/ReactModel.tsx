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

  private __viewJoin(viewId: string) { this.__views?.add(viewId); this.handleViewJoin(viewId) }
  private __viewExit(viewId: string) { this.__views?.delete(viewId); this.handleViewExit(viewId) }

  // Override these methods to add custom handling 
  handleViewJoin(viewId: string) {} // eslint-disable-line @typescript-eslint/no-unused-vars
  handleViewExit(viewId: string) {} // eslint-disable-line @typescript-eslint/no-unused-vars

  // Public function to assert that users do not subscribe directly to view-join/exit events
  subscribe<T>(scope: string, event: string, methodName: string | ((e: T) => void)): void {
    if ((event === 'view-join' || event === 'view-exit')) {
      throw new Error(
        `In @croquet/react you cannot directly subscribe to ${event}.\n`
      + `Override ${event === 'view-join' ? 'handleViewJoin(viewId)' : 'handleViewExit(viewId)'} instead\n`
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
    // custom logic before and after the Model handler
    // is called. Since closures cannot be serialized, we
    // need to convert `hack` to a String, replace the lost
    // values with literals (obtained at runtime) and then
    // convert that string into a function again.
    // That function will be used by a (yet) undocumented
    // feature of Croquet that allows you to pass a function
    // instead of a method.

    function hack(data: any) {
      // @ts-expect-error the this will exist when the function is executed
      this.methodName(data)
      // @ts-expect-error the this will exist when the function is executed
      this.publish(this.sessionId, 'react-updated')
    }

    const hackString = hack
      .toString()
      //
      // replace methodName by the actual method name
      .replace('methodName', methodName)
      //
      // extract only the function body
      .replace(/^[^{]+\{/, '')
      .replace(/\}[^}]*$/, '')

    // this function will receive a single argument: data
    const func = new Function('data', hackString) as (e: unknown) => void

    super.subscribe(scope, event, func)
  }
}

ReactModel.register('ReactModel')
