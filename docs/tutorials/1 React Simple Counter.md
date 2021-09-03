This tutorial directly corresponds to the ["Hello World" tutorial](../croquet/tutorial-1_1_hello_world.html) of the Croquet Library. In fact the model side looks exactly the same. The following document assumes you are familiar with the main concepts presented there.

The tutorials for the `@croquet/react` package makes use of CodeSandbox to show a whole React project for each example, with the same structure as your own project would have locally. The bundler used for this CodeSandBox is `parcel`, but `@croquet/react` is bundler-agnostic.

<iframe src="https://codesandbox.io/embed/blissful-rain-4rpql?fontsize=14&hidenavigation=1&theme=dark"
     style="width:80%; height:500px; border:1; border-radius: 4px; overflow:hidden;"
     title="blissful-rain-4rpql"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

We start by importing React and Croquet Library here as npm dependencies.

```
import ReactDom from "react-dom";
import React, { useState } from "react";
import { Model } from "@croquet/croquet";
import {
  usePublish,
  useModelRoot,
  InCroquetSession,
  useSubscribe
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

After the model, we define `CounterApp` as our top level React component. In it, we use the `InCroquetSession` component, which takes the role of `Session.join` in `@croquet/croquet`, takes the same parameters and then provides the running Croquet session to its child components.

```
function CounterApp() {
  return (
    <InCroquetSession
      name="counter"
      appId="io.croquet.react.counter"
      apiKey: "1_k2xgbwsmtplovtjbknerd53i73otnqvlwwjvix0f"
      password="abc" model={CounterModel}>
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