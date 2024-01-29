This tutorial directly corresponds to the ["Hello World" tutorial](../croquet/tutorial-1_1_hello_world.html) of the Croquet Library. In fact the model side looks exactly the same. The following document assumes you are familiar with the main concepts presented there.

The following example uses [Vite](https://vitejs.dev) for build. Other bundlers work fine also, but Vite is easy to get started as of writing in early 2024.

<iframe src="https://../../react-croquet-counter"
     style="width:60%; height:500px; border:1; border-radius: 4px; overflow:hidden;"
></iframe>

The source code is available on [Github](https://github.com/croquet/react-croquet-counter).

We start by importing React and Croquet Library here as npm dependencies.

```
import ReactDOM from "react-dom/client";
import React, { useState } from "react";
import { Model } from "@croquet/croquet";
import {
  usePublish,
  useModelRoot,
  InCroquetSession,
  useSubscribe,
  Model
} from "@croquet/react";
```

The `CounterModel` has one state called "count" (`this.count`), and it publishes a message called "count" when the value of count changes. A common practice for the message scope (the first argument) is to use `this.id` to indicate that this particular model's `count` has been changed or requested to be reset.

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
  }
}
```

After the model, we define `CounterApp` as our top level React component. In it, we use the `InCroquetSession` component, which takes the role of `Session.join` in `@croquet/croquet`, takes the same parameters and then provides the running Croquet session to its child components. We use Vite's feature to configure parameters. You can use different mechanismsor just hardcode your configuration if you use a different bundler.

```
function CounterApp() {
  const appId = import.meta.env["VITE_CROQUET_APP_ID"] || CroquetApp.autoSession("q");
  const apiKey = import.meta.env["VITE_CROQUET_API_KEY"];
  return (
    <InCroquetSession
      name="counter"
      apiKey={apiKey}
      appId={appId}
      password="abc"
      model={CounterModel}>
      <CounterDisplay />
    </InCroquetSession>
  );
}
```

Next, we define the `CounterDisplay` component, which has two goals:

 - Rendering the live count of the replicated counter
 - Resetting the counter on click

```
 function CounterDisplay() {
  const model = useModelRoot();
```

First, we use the `useModelRoot` hook to get hold of the `CounterModel` in our session.
Next, we create a state with the `useState` hook. Then, we set up subscription for the counter message, and set the state.

If we just want to render the up-to-date count, we can finish our component with

```
return <div>{count}</div>;
```

But, to explore how we can have information flow back from our component to the `CounterModel`, let's set up our component to reset the counter when we click the count.

First, we create a callback that will publish the corresponding event like this.

```
const publishReset = usePublish(() => [model.id, "reset"]);
```

When we call `publishReset()`, it will publish a "reset" event to the `model.id` scope, which our `CounterModel` listens to.

All that's left to do is to use this callback in the onClick handler of our returned count element. Let's also add some styles to make the count more prominent.

```
return (
<div
    onClick={publishReset}
    style={{ margin: "1em", fontSize: "3em", cursor: "pointer" }}
>
    {count}
</div>
);
```

Now, you should see a live ticking counter, which resets when you click it. You can open the URL shown in the preview section of the CodeSandbox embed in another tab or window and you should see the same live replicated counter as a second session participant.

To see a more interesting multi-user interaction, check out the next tutorial, where we implement a simple multiplayer music box.
