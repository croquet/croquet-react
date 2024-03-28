In the [previous tutorial](./tutorial-3_0_React_Mondrian.html), we built the basis of our Mondrian application.
Now, we will extend it to display the number of connected users!

## Updating the Models

In order to track the number of connected users, we have to update our models.
However, keeping the user count inside the `Painting` model is not the best approach.

1. **Create a new file `models/root.ts`**

We will start by creating a `Root` model where we will store both the painting model and the set of connected users.

```ts
import { Model } from "@croquet/react";
import PaintingModel from "./painting";

export default class RootModel extends Model {
  painting: PaintingModel;
  users: Set<string>;

  init(options) {
    super.init(options);
    this.painting = PaintingModel.create(options);

    this.users = new Set();
  }
}

// ⚠️ Never forget to register your models!!
RootModel.register("RootModel");
```

This `RootModel` contains two attributes:

- `painting`: Stores the `Painting` model we created in the previous tutorial.
- `users`: Stores a set of `viewId`s representing connected users.
  We opted to store these values instead of a simple count because it gives us more information that may be useful in the future.

These attributes are initialized in the [init](../croquet/Model.html#init) method.
Note that we use the [create](../croquet/Model.html#.create) method to create a new instance of the `Painting` model.

2. **Update `App.tsx` and `main.tsx` to use the `RootModel`**

Now we need to change the application to use the `RootModel` instead.
Make sure your `main.tsx` file looks like the following:

```tsx
// ... Other imports
import RootModel from "./src/models/root";

const container = document.getElementById("root");
createRoot(container!).render(
  <CroquetRoot
    sessionParams={{
      model: RootModel,
      name: import.meta.env["VITE_CROQUET_NAME"],
      appId: import.meta.env["VITE_CROQUET_APP_ID"],
      apiKey: import.meta.env["VITE_CROQUET_API_KEY"],
      password: import.meta.env["VITE_CROQUET_PASSWORD"],
    }}
  >
    <App />
  </CroquetRoot>
);
```

This udpate will change the model that will be returned by the `useModelRoot` hook in the `App.tsx` file.
For this reason, we have to update that file to use the `RootModel` instead of the `PaintingModel`.

Whenever we access the painting cells, we have to use `model.painting.cells` attribute.
Since the painting related events are still associated to the `PaintingModel`, they need to be associated with the `PaintingModel`'s `id`.
Thus, those events must be bound to the scope of `model.painting.id`.
Make sure you change the following lines:

```tsx
// ... Other imports
import RootModel from "./models/root";

export default function App() {
  const model: RootModel = useModelRoot() as RootModel;

  // ...Other state declarations
  const [paintingCells, set_paintingCells] = useState(model.painting.cells);

  useSubscribe(model.painting.id, "cellPainted", () =>
    set_paintingCells(model.painting.cells)
  );
  useSubscribe(model.painting.id, "paintingReset", () =>
    set_paintingCells(model.painting.cells)
  );

  const publishPaint = usePublish((data) => [model.painting.id, "paint", data]);
  const resetPainting = usePublish(() => [model.painting.id, "reset"]);

  // Rest of the code
}
```

## Subscribing to user dis/connections

Now that our application is working using the new `RootModel`, it's time to monitor user connection and disconnection.

Croquet provides two events that are fired whenever a new view connects or disconnects from the session: [view-join](../croquet/global.html#event:view-join) and [view-exit](../croquet/global.html#event:view-exit).
These events can only be subscribed on the Model side.

Update yur `models/root.ts` file to subscribe to these events:

```ts
class RootModel extends Model {
  init(options) {
    // Other code...

    this.subscribe(this.sessionId, "view-join", this.userJoined);
    this.subscribe(this.sessionId, "view-exit", this.userLeft);
  }

  userJoined(viewId) {
    this.users.add(viewId);
    this.publish(this.id, "userJoined", viewId);
  }
  userLeft(viewId) {
    this.users.delete(viewId);
    this.publish(this.id, "userLeft", viewId);
  }
}
```

Note that the `view-join` and `view-exit` events are bound to the `sessionId`, and not to the model itself.
As seen in the previous tutorial, we have to publish an Output event whenever the model is updated.

## Displaying the user count

Finally we need to display the number of connected users.
This involves creating a new state (`users`), and subscribing to the Output events emitted by the `RootModel`.

1. **Store connected users in state**

Update the `App.tsx` file as follows:

```tsx
export default function App() {
  // ... Other state declarations
  const [users, set_users] = useState(model.users);
  const nUsers = users.size;

  // ... Other event subscriptions
  useSubscribe(model.id, "userJoined", () => set_users(new Set(model.users)));
  useSubscribe(model.id, "userLeft", () => set_users(new Set(model.users)));

  // Rest of the code...
}
```

Note that the `userJoined` and `userLeft` events are bound to the `RootModel`.
For that reason we will use `model.id` as the scope.

Since `users` is a [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set), we have to create a new set whenever we want to update it (check why in the [React docs](https://react.dev/learn/updating-arrays-in-state)!): `set_users(new Set(model.users)`.

2. **Render the number of users**

Now we just need to display the number of users in the screen.
Update the `App.tsx` file as follows:

```tsx
export default function App() {
  // Rest of the code...

  const nUsers = users.size;

  return (
    <div className="App">
      <div className="user-count">
        <BsPeopleFill />
        <span>{nUsers}</span>
      </div>
      {/* ... Other components */}
    </div>
  );
}
```
