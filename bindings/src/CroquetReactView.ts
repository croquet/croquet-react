import { View } from "@croquet/croquet"
import { ReactModel } from "./ReactModel"


export type UpdateCallback = (time: number) => void
export type SyncedCallback = (flag: boolean) => void
export type DetachCallback = () => void

let storedSyncedCallback: ((flag: boolean) => void) | null = null

// our top level view that gets the root model
// and from which we create our one-time-use views per component
export class CroquetReactView extends View {
    model: ReactModel
    updateCallback: UpdateCallback | null
    syncedCallback: SyncedCallback | null
    detachCallback: DetachCallback | null
  
    constructor(model: ReactModel) {
      super(model)
      this.model = model
      this.updateCallback = null
      this.syncedCallback = storedSyncedCallback
      this.detachCallback = null
      this.subscribe(this.viewId, 'synced', this.synced)
    }
  
    update(time: number) {
      if (this.updateCallback !== null) {
        this.updateCallback(time)
      }
    }
  
    synced(flag: boolean) {
      // console.log('synced', flag)
      if (this.syncedCallback) {
        this.syncedCallback(flag)
      }
    }
  
    detach() {
      if (this.detachCallback) {
        this.detachCallback()
      }
      super.detach()
    }
  }


/** A function to set up the handler for the synced event. 
  * It is supposed to be called from the React component that 
  * calls createReactSession() in the following manner from where the 
  *
  *```
  *setSyncedCallback((flag) => {
  *    console.log(`synced`, flag)
  *    if (flag) {
  *        setCroquetView((old) => session.view)
  *    }
  *    session.view.detachCallback = () => {
  *        console.log(`detached`)
  *        setCroquetView(null)
  *    }
  *})
  *```
  */
export function setSyncedCallback(func: (flag: boolean) => void) {
  storedSyncedCallback = func
}