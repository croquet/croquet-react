In this tutorial, we'll explore how to build a collaborative Mondrian-style painting application using Croquet and React.
The painting will be synchronized across multiple clients, allowing users to collaborate in real-time on creating a shared canvas.
This tutorial assumes you have basic knowledge of [React](https://react.dev/learn) and familiarity with the [main concepts of Croquet](../croquet/index.html#main-concepts).

The source code for this example is available on [Github](https://github.com/albuquerquedematos/react-croquet-mondrian).

<iframe src="https://croquet.io/dev/mondrian"
     style="width:100%; height:700px; border:0; border-radius: 4px; overflow:scroll;"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>


## Building the Model

We start by creating the painting model, which will hold the data that will be replicated across every user.
Before that, we create a small utility file where we define the colors that will be used in the painting, as well as configuring the default colors of each cell.

1. **Create a new file `data/paintingCells.tsx` with the following content**

```tsx
export const SCARLET    = '#DB3F27'
export const MACARONI   = '#F1BD47'
export const BLUE       = '#003F75'
export const BLACK      = '#060700'
export const PALE_GREY  = '#CBD2DA'
export const LIGHT_GREY = '#E7E3DD'

export const defaultPaintingCells = [
  { id: 0,  color: PALE_GREY  },
  { id: 1,  color: LIGHT_GREY },
  { id: 2,  color: MACARONI   },
  { id: 3,  color: LIGHT_GREY },
  { id: 4,  color: PALE_GREY  },
  { id: 5,  color: MACARONI   },
  { id: 6,  color: SCARLET    },
  { id: 7,  color: MACARONI   },
  { id: 8,  color: LIGHT_GREY },
  { id: 9,  color: LIGHT_GREY },
  { id: 10, color: BLACK      },
  { id: 11, color: PALE_GREY  },
  { id: 12, color: PALE_GREY  },
  { id: 13, color: PALE_GREY  },
  { id: 14, color: BLACK      },
  { id: 15, color: LIGHT_GREY },
  { id: 16, color: BLUE       },
  { id: 17, color: LIGHT_GREY },
  { id: 18, color: LIGHT_GREY },
  { id: 19, color: SCARLET    },
]
```

Now we can create our painting model.

2. **Create a new file `models/PaintingModel.ts`**

```tsx
import { Model } from '@croquet/react'
import { defaultPaintingCells } from '../data/paintingCells'

export default class PaintingModel extends Model {
  cells: { id: number; color: string }[]

  init(options) {
    super.init(options)
    this.cells = defaultPaintingCells

    this.subscribe(this.id, 'paint', this.paintCell)
    this.subscribe(this.id, 'reset', this.resetPainting)
  }

  paintCell(data) {
    if (!data) return
    const { cellId, newColor } = data
    this.cells = this.cells.map((cell) => (cell.id === cellId ? { ...cell, color: newColor } : cell))
    this.publish(this.id, 'cellPainted')
  }

  resetPainting() {
    this.cells = defaultPaintingCells
    this.publish(this.id, 'paintingReset')
  }
}
```

 * The `init` method is called when a new instance of the model is created.
   In this method, we call the superclass `init` and initialize the `cells` attribute with the data created in the previous step.
   We also subscribe to the `'paint'` and `'reset'` model events, setting `this.paintCell` and `this.resetPainting` as the event handlers.
   Note that models should be initialized in the `init` method.
   For more information, please refer to [this page](../croquet/index.html#models)

 * The `resetPainting` is called whenever the model receives a `'reset'` event associated with the model's scope.
   To reset a model, we just set the cells to their default state.
   We also publish a `paintingReset` view event, so that the view will update its state accordingly.

 * The `paintCell` method is called whenever a `paint` event is emitted.
   The data sent in that event is assumed to have a `cellId`, identifying the cell to be painted, and `newColor`, a string with the new color to be set in the respective cell.
   We use the [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) method to create a new array of cells from the previous one:
   For each cell, if the cell is to be updated (`cell.id === cellId`), we return that cell, overriding the `color` field (`{ ...cell, color: newColor }`);
   Otherwise, we return the original cell.

3. ⚠️ **Make sure you don't forget to register the model!**

Now that we created the model, it's **extremely important** that we do not forget to register it in Croquet. Do so by adding the following line in the end of `models/PaintingModel.tsx`.

```ts
PaintingModel.register('PaintingModel')
```

Great job completing this step!
Now we have a functioning model ready to be shared among multiple users!
Our next step is to build the View element, which will be the interface between the Model and the user.



## Building the View

Now we will make the React components that will render the shared painting model.
Let's start by creating the `Painting` component, which will display the actual painting.
We assume it receives the model `cell` data in the `paintingCell` props.

1. **Create a new file `components/Painting.tsx`**
```ts

type LayoutProps = {
    children: any,
    w?: number,
    h?: number
}

function Row({ children, w, h }: LayoutProps) {
  return (
    <div className='row h-100 w-100' style={{ width: `${w}%`, height: `${h}%` }}>
      {children}
    </div>
  )
}

function Col({ children, w, h }: LayoutProps) {
  return (
    <div className='col' style={{ width: `${w}%`, height: `${h}%` }}>
      {children}
    </div>
  )
}

type PaintingProps = {
  paintingCells: any,
  onClick: (cellId: number) => void
}

type CellProps = {
  id: number,
  h?: number,
  w?: number,
  className?: string
}
export default function Painting({ paintingCells, onClick }: PaintingProps) {
  
  const gapSize = 0.25
  const size = `calc(100vw - (${gapSize}rem * 2))`

  function Cell({ id, h, w, className = '' }: CellProps) {
    return (
      <div {...{
        id: `cell-${id}`,
        className: `cell ${className}`,
        style: {
          width: w ? `${w}%` : '100%',
          height: h ? `${h}%` : '100%',
          outline: `${gapSize}rem solid black`,
          backgroundColor: paintingCells[id].color,
        }
      }} />
    )
  }

  return (
    <div className='painting' style={{ width: size, height: size }}>
      <Row w={100} h={100}>
        <Col w={90}>
          <Row h={10}>
            <Cell id={0} w={30} />
            <Cell id={1} w={40} />
            <Cell id={2} w={30} />
          </Row>
          <Row h={90}>
            <Col w={10}>
              <Cell id={3} h={25}/>
              <Cell id={4} h={45}/>
              <Cell id={5} h={30}/>
            </Col>
            <Col w={90}>
              <Row h={60}>
                <Cell id={6} h={100} w={41.5}/>
                <Col>
                  <Cell id={7} h={50}/>
                  <Row h={50}>
                    <Cell id={8} />
                    <Cell id={9} />
                  </Row>
                </Col>
              </Row>
              <Row h={40}>
                <Col w={30}>
                  <Cell id={10} h={70}/>
                  <Cell id={11} h={30}/>
                </Col>
                <Col w={70}>
                  <Row h={90}>
                    <Col w={52.5}>
                      <Cell id={12} h={40}/>
                      <Cell id={13} h={40}/>
                      <Cell id={14} h={20}/>
                    </Col>
                    <Col w={47.5}>
                      <Cell id={15} h={40}/>
                      <Cell id={16} h={60}/>
                    </Col>
                  </Row>
                  <Cell id={17} h={10} />
                </Col>
              </Row>
            </Col>
          </Row>
        </Col>
        <Col w={10}>
          <Cell id={18} />
          <Cell id={19} h={30} />
        </Col>
      </Row>
    </div>
  )
}

```

 * `Row` and `Col` are helper components that will be useful in creating the Painting Layout.

 * The `Painting` component will display the actual painting, and uses the `Row`, `Col` and `Cell` components to create the painting layout.

 * The `Cell` component represents each painting rectangle, and is just a div with a border and a background.
   It is defined inside `Painting` so that we can access `paintingCells` directly from the `Cell` component, without having to pass it as props.
   This will be useful when we want to pass other props as well.

We are almost done! The next step is to create the `<App/>` component that will connect the Model to the View!!

2. **Create the App component**

First let's create the styles that will be used in this application.
For simplicity, we included all the styles that will be required in this tutorial.

Create a new file `styles.css` with the following content:

```css
.painting {
  max-width: 40rem;
  max-height: 40rem;
}

.App {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  height: 100vh;
  width: 100%;
  min-height: 28rem;
  min-width: 10rem;
}

.painting,
.row,
.col {
  display: flex;
  gap: 2px;
  align-items: stretch;
  align-content: space-between;
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
}
```

Now we need to make the `<App/>` component.
Create a new file `App.tsx` with the following contents

```tsx
import './styles.css'

import { useState } from 'react'
import { useModelRoot, } from '@croquet/react'

import PaintingModel from './models/painting'
import Painting from './components/Painting'

export default function App() {
  const model: PaintingModel = useModelRoot() as PaintingModel

  const [paintingCells, set_paintingCells] = useState(model.cells)

  return (
    <div className='App'>
      <Painting {...{ paintingCells, onClick: () => null }}/>
    </div>
  )
}
```

This component creates a `paintingCells` state that is initialized from the Painting model cells.
It then passes it to the `<Painting/>` component created in the previous step.

If you open your browser now, you should see a blank page, and if you check the console, you will see the following error message:

```
Error: No Croquet Session found
```

This indicates that we are using the `useModelRoot` hook outside of the Croquet context.
To fix this, we need to encapsulate the `<App/>` inside `<CroquetRoot/>`.

3. **Insert your App inside the Croquet Session context provider**

Make sure your `main.tsx` file looks like the following:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { CroquetRoot } from '@croquet/react'
import PaintingModel from './src/models/painting'

import App from './src/App'

const container = document.getElementById('root')
createRoot(container!).render(
  <StrictMode>
    <CroquetRoot
      sessionParams={{
        model: PaintingModel,
        name: import.meta.env['VITE_CROQUET_NAME'],
        appId: import.meta.env['VITE_CROQUET_APP_ID'],
        apiKey: import.meta.env['VITE_CROQUET_API_KEY'],
        password: import.meta.env['VITE_CROQUET_PASSWORD'],
      }}
    >
      <App />
    </CroquetRoot>
  </StrictMode>
)
```

The `<CroquetRoot/>` component provides the Croquet Session context to its children.
That is why it is required in order to use Croquet hooks.
For more information about this component, please refer to the [API Documentation](./global.html#CroquetRoot).


4. **Store your configuration in environment variables**

We recommend using environment variables to hold these configuration values, since it makes it easier to manage configurations for multiple environments (e.g. development and production).

To do so, create a `.env` file with the following contents:
```
VITE_CROQUET_NAME=THE_APP_NAME
VITE_CROQUET_APP_ID=YOUR_APP_ID
VITE_CROQUET_API_KEY=YOUR_API_KEY
VITE_CROQUET_PASSWORD=THE_APP_PASSWORD
```

Replace the placeholders with your actual values.
If you don't have an App ID and API Key, you can get them on the [Croquet Dashboard](https://croquet.io/account/)


Congratulations!! Now you should see your beautiful Mondrian painting on your screen.
The next step is to add the logic to change the painting colors!!


## Changing the painting colors

First, let's create the `<Colors/>` component, where users will be able to select the color they want to paint with, as well as reset the painting to its original state.

1. **Create the `components/Colors.tsx` file with the following contents**
```tsx
import { BLACK, BLUE, LIGHT_GREY, MACARONI, PALE_GREY, SCARLET } from '../data/paintingCells'

export default function Colors({ selectedColor, set_selectedColor }) {

  const colors = [ SCARLET, MACARONI, BLUE, BLACK, PALE_GREY, LIGHT_GREY ]
  const size = 3

  function Color({ color }) {
    return (
      <div
        className='color'
        style={{ 
          backgroundColor: color,
          border: color === selectedColor ? '2px solid black' : '2px solid white',
          width: `${size}rem`,
          height: `${size}rem`
        }}
        onClick={() => set_selectedColor(color)}
      />
    )
  }

  return (
    <div className='colors'>
      {colors.map((color) => <Color key={color} color={color} />)}
    </div>
  )
}
```

The `<Color/>` component renders each color circle.
Whenever each of those circles is clicked, we call the `set_selectedColor` to change the selected color.

Now we need to render this component in our `<App/>` and to add the required state.

2. **Allow <App/> to manage the selected color**

Add a React state to manage the selected color:

```tsx

export default function App() {
  // Other code here...

  const [selectedColor, set_selectedColor] = useState(null)
  
  // Other code here...
}
```

Now we need to render the `<Colors/>` component we just created.
Change the `return` statement as follows:

```tsx
// !! Don't forget to import your component
import Colors from './components/Colors'

export default function App() {
  // Other code here...

  return (
    <div className='App'>
      <Colors {...{ selectedColor, set_selectedColor }}/>
      <Painting {...{ paintingCells, onClick: paintCell }}/>
    </div>
  )
}
```

Note that since this state is not in the Croquet model, it will not be shared between different users!

Now we need to change the cell colors whenever a cell is clicked.

3. **Change cell colors when a cell is clicked**

First, we need to add an `onClick` handler to the `<Cell/>` component.
Update the `components/Painting.tsx` file as follows:

```tsx
// Add the onClick prop
type PaintingProps = {
  // ...
  onClick: (cellId: number) => void
}
export default function Painting({ paintingCells, onClick }: Props) {

  function Cell({ id, h, w, className = '' }: CellProps) {
    return (
      <div {...{
        // Add the onClick handler
        onClick: () => onClick(id),
      }} />
    )
  }
```

Note that we pass the cell `id` to the received `onClick` function.

Now, we need to create the function that will change the clicked cell to the selected color.

Update the `App.tsx` file as follows:

```tsx
// Import usePublish
import { ...otherImports , usePublish } from '@croquet/react'

export default function App() {

  // Other code...

  // Add the following lines
  const publishPaint  = usePublish((data) => [model.id, 'paint', data])
  
  const paintCell = (cellId) => {
    if(selectedColor === null) return
    const payload = { cellId, newColor: selectedColor }
    publishPaint(payload)
  }

  return (
    <div className='App'>
      <Colors {...{ selectedColor, set_selectedColor, resetPainting }}/>
      {/* Pass the paintCell function as the onClick prop */}
      <Painting {...{ paintingCells, onClick: paintCell }}/>
    </div>
  )
}
```

To paint a cell we need to make sure a color is selected, and then we need to emit the `paint` event the model subscribed to.

To emit an event to a model, we just need to use the `usePublish` hook.
For more information about this hook, feel free to check out the [Api Documentation](global.html#usePublish).


4. **Subscribe the view to model updates**

Now if you select a color and then you click on a painting square, you won't immediately see the square changing colors.
Don't worry, we will make it work in this step!!

If you refresh your page, you will see the new cell painting.
This indicates that the model is correctly being updated, but the view is not.
Remember when defining the event handlers, we published a view event?
That's the missing piece: The view should be subscribed to that same event!

Update `App.tsx` with the following update:

```tsx
import { ...otherImports, useSubscribe } from '@croquet/react'

export default function App() {

  // Other code...

  useSubscribe(model.id, 'cellPainted',   () => set_paintingCells(model.cells))

  // Other code...
}
```

With this code, whenever the model emits a `'cellPainted'` event, the view will call the function passed to the `useSubscribe` hook.
In this case, we will update the `paintingCells` state with the new cells!!
For more information about this hook, feel free to check out the [Api Documentation](global.html#useSubscribe).

Now you will be able to immediatly see the changes any users makes to the model!!



## Resetting the painting to its original state

Adding logic to reset the painting to its original state should be very similar to what we did before.
Let's go through it!

1. **Add a reset button to the `<Colors/>` component**

We need to add a button that will reset the painting to its original colors when clicked.

Update the `components/Colors.tsx` file:

```tsx
import { IoIosRefresh } from 'react-icons/io'

export default function Colors({ ...otherProps, resetPainting }) {

  function Button({onClick, icon}: {onClick: () => void, icon: JSX.Element}){
    return (
      <div 
        className='color d-flex align-items-center justify-content-center' 
        style={{ width: `${size}rem`, height:`${size}rem`}}
        onClick={onClick}
      >
        {icon}
      </div>
    )
  }

  return (
    <div className='colors'>
      <Button {...{
        onClick: resetPainting,
        icon: <IoIosRefresh size={`${size/1.5}rem`} />
      }} />
      {colors.map((color) => <Color key={color} color={color} />)}
    </div>
  )
}

```

We created a helper component, `<Button/>` that will display a given icon and call a given function when clicked.
We then add it before the color circles.

Now we just need to create a function to publish the `'reset'` event to the model, and to subscribe to `'paintingReset'` view events.
Update the `App.tsx` file as follows:

```tsx
export default function App() {
  // Other code...

  useSubscribe(model.id, 'paintingReset', () => set_paintingCells(model.cells))
  const resetPainting = usePublish(() => [model.id, 'reset'])

  return (
    <div className='App'>
      <Colors {...{ ...otherProps, resetPainting }}/>
      {/* Other components */}
    </div>
  )
}
```

That's it! Now when you click the reset button, the painting should return to its original state!
