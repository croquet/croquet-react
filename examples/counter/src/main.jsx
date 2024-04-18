import ReactDOM from 'react-dom/client'
import { useState } from 'react'
import { usePublish, useModelRoot, InCroquetSession, useSubscribe, Model, App as CroquetApp } from '@croquet/react'

class CounterModel extends Model {
  init(option) {
    super.init(option)
    this.count = 0
    this.future(1000).tick()
    this.subscribe(this.id, 'reset', this.resetCounter)
  }

  resetCounter() {
    this.count = 0
    this.publish(this.id, 'count')
  }

  tick() {
    this.count += 1
    this.publish(this.id, 'count')
    this.future(1000).tick()
  }
}

CounterModel.register('CounterModel')

function CounterApp() {
  const appId = import.meta.env['VITE_CROQUET_APP_ID'] || CroquetApp.autoSession('q')
  const apiKey = import.meta.env['VITE_CROQUET_API_KEY']

  return (
    <InCroquetSession apiKey={apiKey} appId={appId} password='abc' name='counter' model={CounterModel}>
      <CounterDisplay />
    </InCroquetSession>
  )
}

function CounterDisplay() {
  const model = useModelRoot()
  const [count, setCount] = useState(model.count)

  useSubscribe(model.id, 'count', () => setCount(model.count), [])

  const publishReset = usePublish(() => [model.id, 'reset'], [])

  return (
    <div onClick={publishReset} style={{ margin: '1em', fontSize: '3em', cursor: 'pointer' }}>
      {count}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CounterApp />
  </React.StrictMode>
)
