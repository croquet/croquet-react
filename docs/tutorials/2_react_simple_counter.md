This tutorial directly corresponds to the "Hello World" tutorial of `@croquet/croquet` and the model side looks exactly the same. It will be assumed that you understood the main concepts presented there.

The tutorials for `@croquet/react` will make use of CodeSandbox to be able to show a whole React project around each example, with the same structure as your own project would have locally. You can go ahead and change the code right in here and the running app should update accordingly.

<iframe
     src="https://codesandbox.io/embed/react-croquet-counter-t5gw9?fontsize=14&module=%2Findex.jsx&theme=light"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="react-croquet counter"
     allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
     sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
   ></iframe>

We start by importing React and croquet libraries, here as npm dependencies instead of the normal croquet library script import.

The `CounterModel` looks very similar to that in the `@croquet/croquet` Hello World example. There is one state called counter, and it publishes a message called "counter" when the value of counter changes.

```
function CounterApp() {
  return (
    <InCroquetSession name="counter" appId="io.croquet.react.counter" apiKey: "1_k2xgbwsmtplovtjbknerd53i73otnqvlwwjvix0f" password="abc" model={CounterModel}>
      <CounterDisplay />
    </InCroquetSession>
  );
}
```

After the model, we define `CounterApp` as our top level React component. In it, we use the `InCroquetSession` component, which takes the role of `Session.join` in `@croquet/croquet`, takes the same parameters and then provides the running Croquet session to its child components.

Next, we define the `CounterDisplay` component, which has two goals:

 - rendering the live count of the replicated counter
 - resetting the counter on click

```
 function CounterDisplay() {
  const model = useModelRoot();
```

First, we use the `useModelRoot` hook to get a hold of the `CounterModel` in our session.
Next, we create a state by the `useState` hook. Then, we set up subscription for the counter message, and set the state.

If we just wanted to render the up-to-date count, we could finish our component with

```
return <div>{count}</div>;
```

But, to explore how we can have information flow back from our component to the `CounterModel`, let's setup our component to reset the counter when we click the count.

First, we create a callback that will publish the corresponding event like this:

```
const publishReset = usePublish(() => ["counter", "reset"]);
```

When we call `publishReset()`, it will publish a "reset" event to the "counter" scope, which our `CounterModel` happens to listen to.

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

To see more interesting multi-user interaction, check out the next tutorial, where we're implementing a simple multiplayer pong game.
