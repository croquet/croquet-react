In previous tutorials, we explored Croquet's capabilities by [creating a collaborative painting](./tutorial-3_0_React_Mondrian.html) and tracking the number of [connected users](./tutorial-3_1_React_Mondrian_Player_Count.html).

In this tutorial, we'll take a step further by enabling users to paint in separate "art studios," represented by Croquet sessions.
Our objective is to ensure that users sharing the same session collaborate on the same painting, while paintings in different sessions remain independent.

Below, you'll find three windows representing three distinct users.
Feel free to switch between studios and experiment with different paintings!

<div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: space-between">
    <iframe src="https://croquet.io/mondrian?tutorial=3&session=studio-1"
        style="flex: 1; min-width: 300px; height:500px; overflow:scroll; border: 1px solid black; border-radius: 5px"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    ></iframe>
    <iframe src="https://croquet.io/mondrian?tutorial=3&session=studio-2"
        style="flex: 1; min-width: 300px; height:500px; overflow:scroll; border: 1px solid black; border-radius: 5px"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    ></iframe>
    <iframe src="https://croquet.io/mondrian?tutorial=3&session=studio-3"
        style="flex: 1; min-width: 300px; height:500px; overflow:scroll; border: 1px solid black; border-radius: 5px"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    ></iframe>
</div>

## Configuring the different sessions

Let's allow users to select the session they wish to join.
Instead of configuring the session name and password in environment variables, we'll create a new file to manage these sessions.

1. **Create a new file `data/sessions.ts`**

```ts
export const sessions = [
  {
    name: 'studio-1',
    password: 'password-1',
  },
  {
    name: 'studio-2',
    password: 'password-2',
  },
  {
    name: 'studio-3',
    password: 'password-3',
  },
]
```

In this tutorial, we've chosen to assign different passwords for each session to demonstrate configuring more than just the session name.
While these values are sourced from a static configuration file here, in complex scenarios, they might be obtained dynamically, such as from an API call.


Now, let's integrate one of the session configurations from our sessions.ts file into main.tsx.

2. **Update `main.tsx` to look like the following**

```tsx
// ... Other imports
import { sessions } from './data/sessions'

const container = document.getElementById("root");
createRoot(container!).render(
  <StrictMode>
    <CroquetRoot
      sessionParams={{
        // ... Other configuration
        name: sessions[0].name,
        password: sessions[0].password,
      }}
    >
      <App />
    </CroquetRoot>
  </StrictMode>
);
```

In this snippet, we're importing session details from our `sessions.ts` file and passing the name and password of the first session in the list to our `CroquetRoot` component.

## Selecting the Croquet Session for User Connection

In this step, we'll implement an interface to manage the Croquet session to which the user connects.
We'll begin by creating the Dropdown component:

1. **Create the `components/Dropdown.tsx` file with the following content**
```tsx
type Option<T> = {
  value: T
  label: string
}
type DropdownProps<T> = {
  selected: any
  options: Option<T>[]
  onChange: (number) => void
}
export default function Dropdown<T>({ selected, options, onChange }: DropdownProps<T>) {
  return (
    <select {...{
      value: selected,
      onChange: (e) => onChange(e.target.selectedIndex),
      style: {
        border: '0.1rem solid black',
        borderRadius: '0.5rem',
        padding: '0.2rem',
      }
    }}>
      {options.map((option, i) => (
        <option key={i} value={i}>{option.label}</option>
      ))}
    </select>
  )
}
```

This component receives a list of available options as props.
Each option consists of a value field, containing the value to be selected, and a label field indicating what will be displayed in each selection item.
Upon selecting an item, the `onChange` callback is triggered, passing the index of the selected item.

Now, let's add the dropdown component to our app!

2. **Update the `src/App.tsx` file**
```tsx
// ... Other imports
import { sessions } from './data/sessions'

export default function App() {
    // ... Other code

    const [selectedOption, setSelectedOption] = useState(0);
    const dropdownOptions = sessions.map((s) => ({ value: s, label: s.name }))
    
    const handleDropdownChange = (selectedIdx) => {
        setSelectedOption(selectedIdx)
    }

    return (
        <div className='App'>
            <Dropdown
              {...{
                selected: selectedOption,
                options: dropdownOptions,
                onChange: handleDropdownChange,
              }}
            />
            {/* ... Other components */}
        </div>
    )
}
```

 * We've introduced a state variable, `selectedOption`, to store the index of the session to which we are connected.
 
 * Using [map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map), we've created the options payload from the available sessions.
 
 * Finally, we've implemented a handler function, `handleDropdownChange`, to update the `selectedOption` variable whenever the user selects a new option in the dropdown.

Now that the user can select a different session, it's time to actually connect to it.

## Dynamically changing the Croquet Session

<!-- In order to dynamically change the name and password passed to `CroquetRoot`, those values should be stored in a React state.
Let's create a new component that will manage this state and pass it to `CroquetRoot`. -->

To enable dynamic changes to the Croquet session's name and password, we need to store these values in a React state.
Let's create a new component to manage this state and pass it to CroquetRoot.

1. **Create a new file `components/SessionManager.tsx` with the following content**
```tsx
import { useState } from 'react'
import { CroquetRoot } from '@croquet/react'

import { sessions } from '../data/sessions'
import RootModel from '../models/root'

export default function SessionManager({ children }) {
  const [session, setSession] = useState({
    name: sessions[0].name,
    password: sessions[0].password,
  })
  const { name, password } = session

  return (
    <CroquetRoot
      sessionParams={{
        model: RootModel,
        appId: import.meta.env['VITE_CROQUET_APP_ID'],
        apiKey: import.meta.env['VITE_CROQUET_API_KEY'],
        name,
        password,
      }}
    >
      <App/>
    </CroquetRoot>
  )
}
```

The `SessionManager` component maintains a state `session` containing the name and password of the connected session.
Whenever these values change, the `CroquetRoot` component establishes a new connection with the updated parameters.


Let's update our entrypoint to use this component.

2. **Update `main.tsx` file**
```tsx
// ... Other code
createRoot(container!).render(
  <StrictMode>
    <SessionManager/>
  </StrictMode>
)
```
Next, we need to enable the App component to modify this state.

3. **Update `components/SessionManager.tsx`**
```tsx
export default function SessionManager({ children }) {
  // ... Other code

  const changeSession = (name: string, password: string) => {
    setSessionsetSession({ name, password })
  }

  return (
    <CroquetRoot { /* ... session configuration */} >
      <App session={session} changeSession={changeSession} />
    </CroquetRoot>
  )
}
```

In this update, we've added a `changeSession` function to the `SessionManager` component.
This function accepts a name and password and updates the session state accordingly.
We then pass this function, along with the current session, to the `App` component.

And now we just need to update our App to use these values.

4. **Update the `App.tsx` file**
```tsx
export default function App({session, changeSession}) {
  // ... Other code

  const selectedOption = sessions.findIndex((s) => s.name === sessionName)
  const handleDropdownChange = (selectedIdx) => {
    const s = sessions[selectedIdx]
    changeSession(s.name, s.password)
  }

  // ... Other code
}
```

With the session now managed in the `SessionManager` component, we no longer require the `selectedOption` state.
Instead, we find the index of the session with the corresponding name from the sessions array.
Additionally, we update the `handleDropdownChange` method to call the `changeSession` function, passing the name and password of the selected session.

If you attempt to change the session in the dropdown, you may notice that a new connection isn't established.
This happens because `CroquetRoot` only initiates a connection the first time it's rendered, regardless of any subsequent changes to its props.

To solve this issue, we can introduce a random key prop to the `CroquetRoot` component.
By assigning a unique key each time it's rendered, React treats each instance of `CroquetRoot` as a distinct component.
Consequently, when the key changes, React renders a new `CroquetRoot` component, forcing the establishment of a fresh connection.

5. **Update `components/SessionManager.tsx`**
```tsx
import { useState } from 'react'
import { CroquetRoot } from '@croquet/react'

import { sessions } from '../data/sessions'
import RootModel from '../models/root'

export default function SessionManager({ children }) {
  // ... Other code 
  return (
    <CroquetRoot
      key={Math.random()}
      {/* ... Other props */}
    >
      <App {/* ... App props */}/>
    </CroquetRoot>
  )
}
```

[It is not recommended](https://react.dev/learn/rendering-lists#why-does-react-need-keys) to use `key=Math.random()` in general, since this will cause unnecessary rerenders.
However, we had to use it in this scenario to establish a new connection when changing the session parameters.

With this step completed, Croquet will reliably establish a connection whenever you switch to a different session.

## Refactoring SessionManager to use React Context

You might have noticed that passing `sessionName` and `changeSession` to the App component feels awkward.
Moreover, if you needed to alter the current session from a deeply nested component, you'd find yourself manually passing these props down the component tree until they reached their destination.
Fortunately, React provides a solution to this issue called [Context](https://react.dev/learn/passing-data-deeply-with-context).

To simplify this process, we'll transform `SessionManager` into a context provider and create a hook to access this context from its descendants.
Let's begin by creating the `SessionContext`.

1. **Update the `components/SessionManager.tsx` file:**
```tsx
// ... Other imports
import { createContext } from 'react'

const SessionContext = createContext(null)

export default function SessionManager() {
  // ... Other logic

  const contextValue = {
    sessionName: name,
    changeSession,
  }

  return (
    <CroquetRoot
      {/* ... Passed props */}
    >
      <SessionContext.Provider value={contextValue}>
        <App {/* ... App props */}/>
      </SessionContext.Provider>
    </CroquetRoot>
  )
}
```

This code initializes a `SessionContext` and wraps our `App` within its provider.
By passing `contextValue` to the provider's `value` prop, we ensure its accessibility to all components within this context.

Now, let's create a hook to simplify access to these values.

2. **Update the `components/SessionManager.tsx` file**
```tsx
import { /* ... Other imports */, useContext } from 'react'

export function useSessionManager() {
  const context = useContext(SessionContext)
  if (context === null) {
    throw new Error('You must be inside a SessionManager context')
  }
  return context
}

export default function SessionManager() {
  // ... Other logic
  return (
    <CroquetRoot
      {/* ... Passed props */}
    >
      <SessionContext.Provider value={contextValue}>
        <App/> { /* Remove the props passed to App */}
      </SessionContext.Provider>
    </CroquetRoot>
  )
}
```

The `useSessionManager` hook checks if the current context is null, indicating that the calling component is not within the SessionContext provider.
In such cases, the hook throws an error.
Otherwise, it returns the context value, corresponding to the value passed as the `value` prop of the `SessionContext.Provider`.
With context values accessed via the hook, there's no need to pass them via props anymore.

Now, let's update our App component to utilize the context's `sessionName` and `changeSession` values.

3. **Update the `App.tsx` file**
```tsx
// ... Other imports
import { useSessionManager } from './components/SessionManager'

export default function App() {
  const { sessionName, changeSession } = useSessionManager()
  // ... Other code
}
```

Now, any component rendered within the `SessionManager` provider can access `sessionName` and `changeSession` through the `useSessionManager` hook.

## Final improvements

There are two final additions we can make to enhance our code:
 
1. We can make the `SessionManager` component more generic by utilizing the `children` prop.

To accomplish this, update the `SessionManager` to accept the `children` prop and pass `<App/>` as its child in `main.tsx`:

**`components/SessionManager.tsx`**
```tsx
// ... Other code
export default function SessionManager({children}) {
  // ... Other logic
  return (
    <CroquetRoot {/* ... Passed props */} >
      <SessionContext.Provider value={contextValue}>
        {children}
      </SessionContext.Provider>
    </CroquetRoot>
  )
}
```

**`main.tsx`**
```tsx
const container = document.getElementById('root')
createRoot(container!).render(
  <StrictMode>
    <SessionManager>
      <App />
    </SessionManager>
  </StrictMode>
)
```


2. By using [useMemo](https://react.dev/reference/react/useMemo) and [useCallback](https://react.dev/reference/react/useCallback), we can [prevent unnecessary rerenders](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions) in our app.

Update `components/SessionManager.tsx` as follows:

```tsx
import { /* ... Other imports */ useCallback, useMemo } from 'react'

export default function SessionManager({ children }) {
  // ... Other code

  const changeSession = useCallback((newName: string, newPassword: string) => {
    setSession({ name: newName, password: newPassword })
  }, [])

  const contextValue = useMemo(
    () => ({
      sessionName: name,
      changeSession,
    }),
    [session, changeSession]
  )

  // ... Other code
}
```


## Next steps

Congratulations!
You've successfully implemented a multi-studio painting application!!

In this tutorial you've learned how to dynamically configure the session your Croquet app is connected to!
This marks the end of this tutorial series!!

## Further Resources

[Croquet API Documentation](./global.html): Explore the comprehensive Croquet API documentation to gain a deeper understanding of Croquet's capabilities and features.

<!-- Croquet Discord Community: Join the Croquet Discord community to connect with other developers, ask questions, share insights, and stay updated on the latest Croquet developments and announcements. -->

Happy coding!
