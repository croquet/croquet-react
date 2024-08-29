import { useEffect } from 'react'
import { useCroquetView } from './useCroquetView'

/** Hook that listens to events matching the provided `scope` and `eventSpec`.
 * Event data is passed as an argument to `callback`.
 * Automatically unsubscribes when the component is demounted.
 * Make sure that `callback` captures the dependencies by creating one with `useCallback` or pass a fresh function.
 * The hook is parameterized by the type of data it receives.
 *
 * ```
 *  function StatusBar({counterModel}) {
 *    const [status, setStatus] = useState('Counting...')
 *
 *    useSubscribe<number>(
 *      counterModel.id,
 *      'maximumReached',
 *      (maximum) => {setStatus('Maximum reached!')},
 *      [setStatus]
 *    )
 *
 *    return <div>Current Status: {status}</div>
 *  }
 * ``` */
export function useSubscribe<T>(scope: string, eventSpec: string, callback: (data: T) => void): void {
  const croquetView = useCroquetView()
  useEffect(() => {
    if (croquetView === null) return

    croquetView.subscribe(scope, eventSpec, callback)

    // cleanup on component unmount
    return () => {
      if (croquetView !== null) {
        croquetView.unsubscribe(scope, eventSpec, callback)
      }
    }
  }, [scope, eventSpec, callback, croquetView])
}
