We built the foundation for our Mondrian application in the [previous tutorial](./tutorial-3_0_React_Mondrian.html).
We will now extend it to display the number of connected views!
Although `@croquet/react` already provides a builtin hook to get the connected views ([useConnectedViews]()), we will implement that logic in this tutorial, since it's a good use case to use multiple models simultaneously.

## Updating the Models

In order to track the number of connected views we have to update our models.
However, keeping the view count inside the `Painting` model is not the best approach.

We start by creating a `Root` model where we will store both the painting model and the set of connected view.

1. **Create a new file `src/models/RootModel.ts`**

```ts
import { ReactModel } from '@croquet/react'
import PaintingModel from './PaintingModel'

export default class RootModel extends ReactModel {
  painting: PaintingModel
  views: Set<string>

  init(options: any) {
    super.init(options)
    this.painting = PaintingModel.create(options)

    this.views = new Set()
  }
}

// ⚠️ Never forget to register your models!!
RootModel.register('RootModel')
```

This `RootModel` contains two attributes:

- `painting`: Stores the `Painting` model we created in the previous tutorial.
- `views`: Stores a set of if of the connected views.
  We opted to store these values instead of a simple count because it gives us more information that may be useful in the future.

These attributes are initialized in the [init](../croquet/Model.html#init) method.
Note that we use the [create](../croquet/Model.html#.create) method to create a new instance of the `Painting` model.

2. **Update `App.tsx` and `Mondrian.tsx` to use the `RootModel`**

Now we need to change the application to use the `RootModel` instead.
Make sure your `src/App.tsx` file looks like the following:

```tsx
// ... Other imports
import RootModel from './models/RootModel'

export default function App() {
  return (
    <CroquetRoot
      sessionParams={{
        model: RootModel,
        // ... Other params
      }}
    >
      <Mondrian />
    </CroquetRoot>
  )
}
```

This udpate will change the model that is returned by the `useReactModelRoot` hook in the `Mondrian.tsx` file.
For this reason, we have to update that file to use the `RootModel` instead of the `PaintingModel`.

Whenever we access the painting cells, we have to use the `model.painting.cells` attribute.
Make sure you change the following lines:

```tsx
// ... Other imports
import RootModel from './models/RootModel'

export default function App() {
  const model: RootModel = useReactModelRoot<RootModel>()

  const paintingCells = model.painting.cells

  const paintCell = (cellId: number) => {
    if (selectedColor === null) return
    const payload = { cellId, newColor: selectedColor }
    model.painting.paint(payload) // update this line
  }

  return (
    <div className='App'>
      <Colors
        {...{
          // ... other props. Update line below
          resetPainting: () => model.painting.reset(),
        }}
      />
    </div>
  )
}
```

## Handling view (dis)connections

Now that our application is working using the new `RootModel`, it's time to handle view connection and disconnection.

ReactModel has two functions that are called when a view connects and disconnects: `handleViewJoin` and `handleViewExit`.
Update your `src/models/RootModel.ts` file to override these methods, and update the connected views accordingly.

```ts
class RootModel extends Model {
  // Other code...

  handleViewJoin(viewId: string) {
    this.views.add(viewId)
  }
  handleViewExit(viewId: string) {
    this.views.delete(viewId)
  }
}
```

## Displaying the view count

Finally we need to display the number of connected views.
Update the `Mondrian.tsx` file as follows:

```tsx
// ... Otherimports
import { BsPeopleFill } from 'react-icons/bs'

export default function Mondrian() {
  // ... Other code

  const viewCount = model.views.size

  return (
    <div className='App'>
      <div className='view-count'>
        <BsPeopleFill />
        <span>{viewCount}</span>
      </div>
      {/* ... Other components */}
    </div>
  )
}
```

## Next steps

Well done!!
In this tutorial we learned how to operate with multiple models, and how to track the number of connected views using the `view-exit` and `view-join` events!

In the [next tutorial](./tutorial-3_2_React_Mondrian_Multiple_Sessions.html) we will learn how to dynamically change the session we are connected to.
