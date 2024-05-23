In previous tutorials, we explored Croquet's capabilities by [creating a collaborative painting](./tutorial-3_0_React_Mondrian.html) and tracking the number of [connected users](./tutorial-3_1_React_Mondrian_Player_Count.html).

In this tutorial, we'll take a step further by enabling users to paint in separate "art studios," represented by different Croquet sessions.
Our goal is to ensure that users sharing the same session collaborate on the same painting, while paintings in different sessions remain independent.

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

1. **Create a new file `src/data/sessions.ts`**

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

Now, let's use one of the session configurations in our `App.tsx`.

2. **Update `src/App.tsx` to look like the following**

```tsx
// ... Other imports
import { sessions } from './data/sessions'

export default function App() {
  return (
    <CroquetRoot
      sessionParams={{
        model: RootModel,
        appId: import.meta.env['VITE_CROQUET_APP_ID'],
        apiKey: import.meta.env['VITE_CROQUET_API_KEY'],
        name: sessions[0].name,
        password: sessions[0].password,
      }}
    >
      <Mondrian />
    </CroquetRoot>
  )
}
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
  onChange: (index: number) => void
}
export default function Dropdown<T>({ selected, options, onChange }: DropdownProps<T>) {
  return (
    <select
      {...{
        value: selected,
        onChange: (e) => onChange(e.target.selectedIndex),
        style: {
          border: '0.1rem solid black',
          borderRadius: '0.5rem',
          padding: '0.2rem',
        },
      }}
    >
      {options.map((option, i) => (
        <option key={i} value={i}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
```

This component receives a list of available options as props.
Each option consists of a value field, containing the value to be selected, and a label field indicating what will be displayed in each selection item.
Upon selecting an item, the `onChange` callback is triggered, passing the index of the selected item.

Now, let's add the dropdown component to our app!

2. **Update the `src/components/Mondrian.tsx` file**

```tsx
// ... Other imports
import { sessions } from '../data/sessions'
import Dropdown from './Dropdown'

export default function App() {
  // ... Other code

  const [selectedOption, setSelectedOption] = useState(0)
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

- We've introduced a state variable, `selectedOption`, to store the index of the session to which we are connected.

- Using [map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map), we've created the options payload from the available sessions.

- Finally, we've implemented a handler function, `handleDropdownChange`, to update the `selectedOption` variable whenever the user selects a new option in the dropdown.

Now that the user can select a different session, it's time to actually connect to it.

## Dynamically changing the Croquet session

`@croquet/react` provides two useful hooks that allow us to dynamically change the Croquet session we are connected to:

- `useCroquetSession()` returns the current session we are connected to;
- `useChangeSession()` returns a function that changes the current session name and password.

We can use the first hook to determine the session we are connected to, and call the function returned by the second hook to change the session.
Since we are obtaining the current session from `useCroquetSession`, we don't need to store the `selectedOption` state anymore.
Instead, we can compute it from the current session and the session data.

1. **Update the `src/components/Mondrian.tsx` file**:

```tsx
// Add these imports
import { useCroquetSession, useChangeSession } from '@croquet/react'

export default function Mondrian() {
  // ... Other code

  // Delete the line below
  // const [selectedOption, setSelectedOption] = useState(0)

  const { name: sessionName } = useCroquetSession()
  const selectedOption = sessions.findIndex((s) => s.name === sessionName)
  const dropdownOptions = sessions.map((s) => ({ value: s, label: s.name }))

  const changeSession = useChangeSession()
  const handleDropdownChange = (selectedIdx: number) => {
    const s = sessions[selectedIdx]
    changeSession({ name: s.name, password: s.password })
  }

  // ... Other code
}
```

With this update, whenever you select a different session on the dropdown, Croquet will connect you to that session!!

## Next steps

Congratulations!
You've successfully implemented a multi-studio painting application!!

In this tutorial you've learned how to dynamically configure the session your Croquet app is connected to!
This marks the end of this tutorial series!!

## Further Resources

[Croquet API Documentation](./global.html): Explore the comprehensive Croquet API documentation to gain a deeper understanding of Croquet's capabilities and features.

<!-- Croquet Discord Community: Join the Croquet Discord community to connect with other developers, ask questions, share insights, and stay updated on the latest Croquet developments and announcements. -->

Happy coding!
