import { useCallback } from 'react'
import { useView } from './useView'

/** Hook that returns a function that will have an event publishing effect.
 * Needs to be provided with a `publishCallback` that determines the event and data to be published,
 * by either returning `[scope, event, data]` or just `[scope, event]`.
 * Any arguments passed to the function returned by the hook will be forwarded to `publishCallback` as-is.
 * Make sure that the callback function captures all its dependencies by creating one with useCallback, or pass a fresh function.
 *
 * The hook is parameterized by the type of data it publishes.
 * You can provide the same type for usePublish and subscribe on the model side to ensure the types are consistent.
 *
 * A simple example:
 * ```
 * function IncrementCounterButton({counterModel}) {
 *    const publishIncrement = usePublish<number>(
 *      () => [counterModel.id, 'increment', 1]
 *    )
 *
 *    return <button onClick={publishIncrement} value='Increment'/>
 * }
 * ```
 *
 * Forwarding arguments:
 * ```
 * function IncrementCounterBy10Button({counterModel}) {
 *    const publishIncrement = usePublish<number>(
 *      (incrementBy) => [counterModel.id, 'increment', incrementBy])
 *
 *    return <button onClick={() => publishIncrement(10)} value='Increment by 10'/>
 * }
 * ```
 */
export function usePublish<T>(
  publishCallback: (...args: any[]) => [string, string] | [string, string, T]
): (...args: any[]) => T | undefined {
  const croquetView = useView()
  return useCallback(
    (...args) => {
      if (croquetView === null) return
      const result = publishCallback(...args)
      let ret: T | undefined
      if (result && result.length >= 2) {
        const [scope, event, data] = result
        croquetView.publish(scope, event, data)
        ret = data
      }
      return ret
    },
    // deps are not in play here as publishCallback has to be fresh to capture what it depends on
    [publishCallback, croquetView]
  )
}
