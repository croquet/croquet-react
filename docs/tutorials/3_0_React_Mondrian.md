In this tutorial, we'll explore how to build a collaborative Mondrian-style painting application using Croquet and React.
The painting will be synchronized across multiple clients, allowing users to collaborate in real-time on creating a shared canvas.
This tutorial assumes you have basic knowledge of [React](https://react.dev/learn) and familiarity with the [main concepts of Croquet](../croquet/index.html#main-concepts).

The source code for this example is available on [Github](https://github.com/croquet/croquet-react-mondrian/).

<iframe
  src="https://croquet.io/dev/mondrian?tutorial=1"
  style="width:100%; height:700px; border:0; border-radius: 4px; overflow:scroll;"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

## Setup

In this tutorial we will build a React application using [Vite](https://vitejs.dev/).
Make sure that you are using at least Node.js v18.

Go to the directory where you want to create your project, and run the following command:

```bash
npm create vite@latest mondrian -- --template react-ts
```

This will create a new directory `mondrian` with the base code for this tutorial.

Next, update the `package.json` file to add the following dependencies:

```json
{
  "dependencies": {
    // ... Other dependencies
    "@croquet/react": "^1.4.4",
    "react-icons": "^5.0.1"
  }
}
```

Finally, go to the `mondrian` directory and install the required dependencies, by running

```bash
npm install
```

To start the application, you just need to run

```bash
npm run dev
```

## Building the Model

We start by creating the painting model, which will hold the data that will be replicated across every user.
Before that, we create a small utility file where we define the colors that will be used in the painting, as well as configuring the default colors of each cell.

1. **Create a new file `src/data/paintingCells.ts` with the following content**

```tsx
export const SCARLET = '#DB3F27'
export const MACARONI = '#F1BD47'
export const BLUE = '#003F75'
export const BLACK = '#060700'
export const PALE_GREY = '#CBD2DA'
export const LIGHT_GREY = '#E7E3DD'

export const defaultPaintingCells = [
  { id: 0, color: PALE_GREY },
  { id: 1, color: LIGHT_GREY },
  { id: 2, color: MACARONI },
  { id: 3, color: LIGHT_GREY },
  { id: 4, color: PALE_GREY },
  { id: 5, color: MACARONI },
  { id: 6, color: SCARLET },
  { id: 7, color: MACARONI },
  { id: 8, color: LIGHT_GREY },
  { id: 9, color: LIGHT_GREY },
  { id: 10, color: BLACK },
  { id: 11, color: PALE_GREY },
  { id: 12, color: PALE_GREY },
  { id: 13, color: PALE_GREY },
  { id: 14, color: BLACK },
  { id: 15, color: LIGHT_GREY },
  { id: 16, color: BLUE },
  { id: 17, color: LIGHT_GREY },
  { id: 18, color: LIGHT_GREY },
  { id: 19, color: SCARLET },
]
```

Now we can create our painting model.

2. **Create a new file `src/models/PaintingModel.ts`**

```ts
import { ReactModel } from '@croquet/react'
import { defaultPaintingCells } from '../data/paintingCells'

export default class PaintingModel extends ReactModel {
  cells: { id: number; color: string }[] = []

  init(options: any) {
    super.init(options)
    this.reset()

    this.subscribe(this.id, 'paint', this.paint)
    this.subscribe(this.id, 'reset', this.reset)
  }

  reset(): void {
    // Creating a clone to avoid mutating the
    // default cells object when changing cell color
    this.cells = structuredClone(defaultPaintingCells)
  }

  paint(data: { cellId: number; newColor: string }): void {
    if (!data) return
    const { cellId, newColor } = data
    this.cells[cellId].color = newColor
  }
}
```

- The `init` method is called when a new instance of the model is created.
  In this method, we call the superclass `init` and initialize the model by calling its `reset` method.
  We also subscribe to the `'paint'` and `'reset'` model events, setting `this.paint` and `this.reset` as the event handlers.
  Whenever any of these events is received, the respective handler will be called.
  Note that **models should be initialized in the `init` method.**
  For more information, please refer to [this page](../croquet/index.html#models)

- The `reset` method is called whenever the model receives a `'reset'` event associated with the model's scope.
  To reset a model, we just set the cells to their default state.
  Note that we need to use `structuredClone`, so that we don't mutate the `defaultPaintingCells` object when calling the `paint` method.

- The `paint` method is called whenever a `paint` event is emitted.
  The data sent in that event is assumed to have a `cellId`, identifying the cell to be painted, and `newColor`, a string with the new color to be set in the respective cell.
  In this method we just need to change the color of the targeted cell.

3. ⚠️ **Make sure you don't forget to register the model!**

Now that we created the model, it's **extremely important** that we do not forget to register it in Croquet.
Do so by adding the following line in the end of `src/models/PaintingModel.tsx`.

```ts
PaintingModel.register('PaintingModel')
```

Great job completing this step!
Now we have a functioning model ready to be shared among multiple users!
Our next step is to build the View element, which will be the interface between the Model and the user.

## Building the View

In this step, we will make the React components that will render the shared painting model.
Let's start by creating the `Painting` component, which will display the actual painting.
We assume it receives the model `cell` data in the `paintingCell` props.

1. **Create a new file `src/components/Painting.tsx`**

```tsx
type LayoutProps = {
  children?: any
  grow?: number
}

function Row({ children, grow = 1 }: LayoutProps) {
  return (
    <div className='row' style={{ flexGrow: grow }}>
      {children}
    </div>
  )
}

function Col({ children, grow = 1 }: LayoutProps) {
  return (
    <div className='col' style={{ flexGrow: grow }}>
      {children}
    </div>
  )
}

type PaintingProps = {
  paintingCells: any
}

type CellProps = {
  grow?: number
  id: number
}
export default function Painting({ paintingCells }: PaintingProps) {
  function Cell({ grow = 1, id }: CellProps) {
    return (
      <div
        id={`cell-${id}`}
        className='cell'
        style={{
          flexGrow: grow,
          backgroundColor: paintingCells[id].color,
        }}
      />
    )
  }
  return (
    <div className='painting'>
      <Row>
        <Col grow={20}>
          <Row>
            <Cell id={0} grow={2} />
            <Cell id={1} grow={4.4} />
            <Cell id={2} grow={3} />
          </Row>
          <Row grow={9}>
            <Col>
              <Cell id={3} grow={1} />
              <Cell id={4} grow={2} />
              <Cell id={5} grow={1} />
            </Col>
            <Col grow={9}>
              <Row grow={2}>
                <Cell id={6} grow={2} />
                <Col>
                  <Cell id={7} />
                  <Row>
                    <Cell id={8} />
                    <Cell id={9} />
                  </Row>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Cell id={10} grow={2} />
                  <Cell id={11} />
                </Col>
                <Col grow={2.5}>
                  <Row grow={8}>
                    <Col>
                      <Cell id={12} />
                      <Cell id={13} />
                      <Cell id={14} grow={0.3} />
                    </Col>
                    <Col>
                      <Cell id={15} grow={1} />
                      <Cell id={16} grow={1.5} />
                    </Col>
                  </Row>
                  <Cell id={17} />
                </Col>
              </Row>
            </Col>
          </Row>
        </Col>
        <Col>
          <Cell id={18} grow={3.9} />
          <Cell id={19} />
        </Col>
      </Row>
    </div>
  )
}
```

- `Row` and `Col` are helper components that will be useful in creating the painting layout.

- The `Painting` component will display the actual painting, and uses the `Row`, `Col` and `Cell` components to create the painting layout.

- The `Cell` component represents each painting rectangle, and is just a div with background color.
  It is defined inside `Painting` so that we can access `paintingCells` directly from the `Cell` component, without having to pass it as props.
  This will be useful when we want to pass other props as well.

We are almost done! The next step is to create the `<App/>` component that will connect the Model to the View!!

2. **Create the App component**

First let's setup the styles that will be used in this application.
For simplicity, we included all the styles that will be required in this tutorial series.

Update the file `src/index.css` with the following content:

```css
html,
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

.App {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.painting,
.row,
.col {
  display: flex;
  gap: calc(min(0.025 * 80vw, 0.025 * (50vh - 2rem)));
  align-items: stretch;
  align-content: space-between;
}

@media (min-aspect-ratio: 1/1) {
  .painting {
    width: calc(min(80vh, 60vw - 2rem)) !important;
    height: calc(min(80vh, 60vw - 2rem)) !important;
  }
}

.painting {
  background-color: black;
  width: calc(min(80vw, 60vh - 2rem));
  height: calc(min(80vw, 60vh - 2rem));
  max-width: 500px !important;
  max-height: 500px !important;
}

.row {
  flex-direction: row;
}

.col {
  flex-direction: column;
}

.d-flex {
  display: flex;
}

.justify-content-center {
  justify-content: center;
}

.align-items-center {
  align-items: center;
}

.colors {
  display: flex;
  gap: 2vw;
  max-width: 35rem;
  justify-content: center;
}

.color {
  margin: 0.1rem;
  padding: 0;
  outline: 0.1rem solid black;
  border-radius: 50%;
  cursor: pointer;
  align-self: center;
  min-width: 1rem;
  min-height: 1rem;
  max-width: 3rem;
  max-height: 3rem;

  svg {
    padding: 1vw;
    width: 100%;
    height: 100%;
  }
}

.user-count {
  align-self: flex-end;
  padding: 0.5rem;
  background-color: gray;
  color: white;
  border-radius: 0.5rem 0 0 0.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
}

.qr-container {
  display: flex;
  width: 100%;
  justify-content: start;
}

select {
  font-size: 14pt;
  padding: 0.2rem 1em;
  text-align: start;
  background-color: transparent;
  border: 0.075rem solid black;
  border-radius: 0.4rem;
  cursor: pointer;
  /* border: none; */
  /* border-bottom: 2px solid #dddddd; */
}

@media screen and (min-width: 50rem) {
  .colors {
    gap: 1rem;
  }
  .color svg {
    padding: 0.5rem !important;
  }
}
```

Now we need to make the `<Mondrian/>` component.
Create a new file `src/components/Mondrian.tsx` with the following contents

```tsx
import { useReactModelRoot } from '@croquet/react'

import PaintingModel from '../models/PaintingModel'
import Painting from './Painting'

export default function Mondrian() {
  const model = useReactModelRoot<PaintingModel>()

  const paintingCells = model.cells

  return (
    <div className='App'>
      <Painting {...{ paintingCells }} />
    </div>
  )
}
```

This component uses the `useReactModelRoot` hook to get the most up to date model data.
It then passes the cell data to the `<Painting/>` component created in the previous step.

Now we need to add it to our `<App/>` component:

```tsx
import Mondrian from './components/Mondrian'

export default function App() {
  return <Mondrian />
}
```

If you open your browser now, you should see a blank page, and if you check the console, you will see the following error message:

```
Error: No Croquet Session found
```

This indicates that we are using the `useReactModelRoot` hook outside of the Croquet context.
To fix this, we need to encapsulate the `<App/>` inside `<CroquetRoot/>`.

3. **Insert your App inside the Croquet Session context provider**

Make sure your `src/App.tsx` file looks like the following:

```tsx
import { CroquetRoot } from '@croquet/react'

import Mondrian from './components/Mondrian'
import PaintingModel from './models/PaintingModel'

export default function App() {
  return (
    <CroquetRoot
      sessionParams={{
        model: PaintingModel,
        appId: import.meta.env['VITE_CROQUET_APP_ID'],
        apiKey: import.meta.env['VITE_CROQUET_API_KEY'],
        name: import.meta.env['VITE_CROQUET_NAME'],
        password: import.meta.env['VITE_CROQUET_PASSWORD'],
      }}
    >
      <Mondrian />
    </CroquetRoot>
  )
}
```

The `<CroquetRoot/>` component provides the Croquet Session context to its children.
That is why it is required in order to use Croquet hooks.
For more information about this component, please refer to the [API Documentation](./global.html#CroquetRoot).

4. **Store your configuration in environment variables**

We recommend using environment variables to hold these configuration values, since it makes it easier to manage configurations for multiple environments (e.g. development and production).

To do so, create a `.env` file with the following contents:

```
VITE_CROQUET_APP_ID=YOUR_APP_ID
VITE_CROQUET_API_KEY=YOUR_API_KEY
VITE_CROQUET_NAME=THE_SESSION_NAME
VITE_CROQUET_PASSWORD=THE_SESSION_PASSWORD
```

Replace the placeholders with your actual values.
If you don't have an App ID and API Key, you can get them on the [Croquet Dashboard](https://croquet.io/account/).
The session name and password are arbitrary values that will determine the session you will be connected to.

Congratulations!! Now you should see your beautiful Mondrian painting on your screen.
The next step is to add the logic to change the painting colors!!

## Changing the painting colors

First, let's create the `<Colors/>` component, where users will be able to select the color they want to paint with, as well as reset the painting to its original state.

1. **Create the `src/components/Colors.tsx` file with the following contents**

```tsx
import { BLACK, BLUE, LIGHT_GREY, MACARONI, PALE_GREY, SCARLET } from '../data/paintingCells'

type ColorsProps = {
  selectedColor: string | null
  selectColor: (color: string) => void
}
export default function Colors({ selectedColor, selectColor }: ColorsProps) {
  const colors = [SCARLET, MACARONI, BLUE, BLACK, PALE_GREY, LIGHT_GREY]
  const size = 3

  type ColorProps = { color: string }
  function Color({ color }: ColorProps) {
    return (
      <div
        className='color'
        style={{
          backgroundColor: color,
          border: color === selectedColor ? '2px solid black' : '2px solid white',
          width: `${size}rem`,
          height: `${size}rem`,
        }}
        onClick={() => selectColor(color)}
      />
    )
  }

  return (
    <div className='colors'>
      {colors.map((color) => (
        <Color key={color} color={color} />
      ))}
    </div>
  )
}
```

The `<Color/>` component renders each color circle.
Whenever each of those circles is clicked, we call the `setSelectedColor` to change the selected color.

Now we need to render this component in our `<Mondrian/>` component and to add the required state.

2. **Allow <Mondrian/> to manage the selected color**

Add a React state to manage the selected color, and render the color picker to your `src/components/Mondrian.tsx` file.

```tsx
import { useState } from 'react'

import Colors from './Colors'
// ... Other imports

export default function Mondrian() {
  // ... Other code

  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  return (
    <div className='App'>
      <Colors
        {...{
          selectedColor,
          selectColor: (color: string) => setSelectedColor(color),
        }}
      />
      <Painting {...{ paintingCells }} />
    </div>
  )
}
```

Note that since the `selectedColor` state is not in the Croquet model, it will not be shared between different users.

Now we need to change the cell colors whenever a cell is clicked.

3. **Change cell colors when a cell is clicked**

First, we need to add an `onClick` handler to the `<Cell/>` component.
Update the `src/components/Painting.tsx` file as follows:

```tsx
// Add the onClick prop
type PaintingProps = {
  // ...
  onClick: (cellId: number) => void
}
export default function Painting({ paintingCells, onClick }: Props) {

  function Cell({ id, h, w, className = '' }: CellProps) {
    return (
      <div
        // Add the onClick handler
        onClick={() => onClick(id)}
      />
    )
  }
```

Note that we pass the cell `id` to the received `onClick` function.

Now, we need to create the function that will change the clicked cell to the selected color.

Update the `src/Mondrian.tsx` file as follows:

```tsx
export default function Mondrian() {
  // Other code...

  const paintCell = (cellId: number) => {
    if (selectedColor === null) return
    const payload = { cellId, newColor: selectedColor }
    model.paint(payload)
  }

  return (
    <div className='App'>
      <Colors
        {...{
          selectedColor,
          selectColor: (color: string) => setSelectedColor(color),
        }}
      />
      <Painting {...{ paintingCells, onClick: paintCell }} />
    </div>
  )
}
```

To paint a cell we need to make sure a color is selected, and then we need to call the model's `paint` method.
Doing so will emit a `paint` event that will be broadcasted to every connected user, and handled by the model's `paint` method.

Now you will be able to see the changes any user makes to the model!!

## Resetting the painting to its original state

Adding logic to reset the painting to its original state should be very similar to what we did before.
Let's go through it!

1. **Add a reset button to the `<Colors/>` component**

We need to add a button that will reset the painting to its original colors when clicked.

Update the `src/components/Colors.tsx` file:

```tsx
import { IoIosRefresh } from 'react-icons/io'

type ColorsProps = {
  // ... other props
  resetPainting: () => void
}
export default function Colors({ ...otherProps, resetPainting }) {
  function Button({ onClick, icon }: { onClick: () => void; icon: JSX.Element }) {
    return (
      <div
        className='color d-flex align-items-center justify-content-center'
        style={{ width: `${size}rem`, height: `${size}rem` }}
        onClick={onClick}
      >
        {icon}
      </div>
    )
  }

  return (
    <div className='colors'>
      <Button
        {...{
          onClick: resetPainting,
          icon: <IoIosRefresh size={`${size / 1.5}rem`} />,
        }}
      />
      {colors.map((color) => (
        <Color key={color} color={color} />
      ))}
    </div>
  )
}
```

We created a helper component, `<Button/>` that will display a given icon and call a given function when clicked.
We then add it before the color circles.

Now we just need to create a function to publish the `reset` event to the model.
Update the `src/Mondrian.tsx` file as follows:

```tsx
export default function App() {
  // ... Other code

  return (
    <div className='App'>
      <Colors
        {...{
          // ... Other props
          resetPainting: () => model.reset(),
        }}
      />
      {/* Other components */}
    </div>
  )
}
```

That's it! Now when you click the reset button, the painting should return to its original state!

## Next steps

Congratulations!
You've created a multi-user painting editor that lets any user edit a shared painting!

Throughout this tutorial, you've touched on several Croquet concepts including Models, Views and Events.
Now that you've seen how these concepts work, check out [Adding the Player Count](./tutorial-3_1_React_Mondrian_Player_Count.html) to see how to work with multiple models at the same time.
