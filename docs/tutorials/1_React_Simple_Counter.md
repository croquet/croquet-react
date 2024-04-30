{@link top.md}

This tutorial directly corresponds to the ["Hello World" tutorial](../croquet/tutorial-1_1_hello_world.html) of the Croquet Library. In fact the model side looks exactly the same. The following document assumes you are familiar with the main concepts presented there.
The source code for this tutorial is available on [Github](https://github.com/croquet/croquet-react-counter).

The following example uses [Vite](https://vitejs.dev) for build. Other bundlers work fine also, but Vite is easy to get started as of writing in early 2024.

<iframe src="../../croquet-react-counter"
     style="width:60%; height:500px; border:1; border-radius: 4px; overflow:hidden;"
></iframe>

We start by creating a file `main.jsx`, and importing the required dependencies:

```
import ReactDOM from "react-dom/client";
import React, { useState } from "react";
import { Model } from "@croquet/croquet";
import {
  usePublish,
  useModelRoot,
  CroquetRoot,
  App as CroquetApp,
  useSubscribe,
  Model
} from "@croquet/react";
```

We then define the `CounterModel` class.
It has one attribute called "count" (`this.count`), and two methods: `resetCounter` and `tick`.
When the object is being initialized, we set the initial counter value to zero, and schedule the `tick` function to be called within 1000 milliseconds.
We also configure the model to call the `resetCounter` method whenever it receives a `reset` event within the `this.id` scope.
It's a common practice to use `this.id` to indicate that this particular model's `count` has been changed or requested to be reset.

Whenever the counter is changed, either in the `resetCounter` or in the `tick` methods, it publishes a `count` event.

Note that after the `tick` function is called, it schedules its next call, just like when the object was initialized.

```
class CounterModel extends Croquet.Model {
  init(options) {
    super.init(options);
    this.count = 0;
    this.future(1000).tick();
    this.subscribe(this.id, "reset", this.resetCounter);
  }

 resetCounter() {
    this.count = 0;
    this.publish(this.id, "count");
  }

 tick() {
    this.count += 1;
    this.publish(this.id, "count");
    this.future(1000).tick();
  }
}
```

After defining the model, we have to register it in the Croquet framework.

```
CounterModel.register("CounterModel");
```

Now, we define the `CounterApp`, which will be our top level React component.
We use the `InCroquetSession` component to provide the running Croquet session to its children.
This component takes the role of the [`Session.join`](../croquet/Session.html#.join) method in `@croquet/croquet`, and can be configured with the same parameters.
We recommend specifying those values in environment variables so that it's easier to manage them (e.g. switching between development and production keys).
For more information about this topic, feel free to check out [this article](https://kinsta.com/knowledgebase/what-is-an-environment-variable/).

```
function CounterApp() {
  return (
    <CroquetRoot
      sessionParams={{
        name: "counter",
        model: CounterModel,
        appId: import.meta.env["VITE_CROQUET_APP_ID"],
        apiKey: import.meta.env["VITE_CROQUET_API_KEY"],
        password: "abc",
      }}
    >
      <CounterDisplay />
    </CroquetRoot>
  );
}

```

Next, we define the `CounterDisplay` component, which represents a view of the model defined above.
For now, it only has the logic to render the live count of the replicated counter.

We use the `useModelRoot` hook to get hold of the `CounterModel` in our session, and use its `count` attribute to initialize the component's state, with the `useState` hook.
Then, we use the `useSubscribe` hook to listen to `count` events within the `model.id`'s scope.
Note that the passed callback sets the `count` state to the value defined in the model.
Finally, the component simply returns the value of the stored counter to display its value.

```
function CounterDisplay() {
  const model = useModelRoot();
  const [count, setCount] = useState(model.count);

  useSubscribe(model.id, "count", () => setCount(model.count), []);

  return <div>{count}</div>;
}
```


To explore how we can have information flow back from our component to the `CounterModel`, let's set up our component to reset the counter when we click the count.

First, we create a function `publishReset` that will publish a `reset` event to the `model.id` scope, which our `CounterModel` listens to.
All that's left to do is to pass this function as `onClick` handler of our returned count element.
Let's also add some styles to make the count more prominent.

The final code should look like this:

```
function CounterDisplay() {
  const model = useModelRoot();
  const [count, setCount] = useState(model.count);

  useSubscribe(model.id, "count", () => setCount(model.count), []);

  // Update the lines below
  const publishReset = usePublish(() => [model.id, "reset"], []);

  return (
    <div
      onClick={publishReset}
      style={{ margin: "1em", fontSize: "3em", cursor: "pointer" }}
    >
      {count}
    </div>
  );
}
```

Now, you should see a live ticking counter, which resets when you click it.
If you open the same page in another tab or window, you should see the same live replicated counter as a second session participant.

To see a more interesting multi-user interaction, check out the next tutorial, where we implement a simple multiplayer music box.
