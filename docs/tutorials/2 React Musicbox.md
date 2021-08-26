In this tutorial, we'll implement a simple multiplayer music box to illustrate realtime view side update and other hooks. We also use TypeScript in this example. The app has a number of "balls", each of which represents the timing and pitch of a note. A participants can manipulated them to compose a two second loop.  The timing for the bar to wrap is synchronized by the model, but the view interpolates the position of the bar and play sound when the bar passes a ball.

Due to eager reloading of CodeSandBox

<iframe src="https://codesandbox.io/embed/purple-silence-ikqiv?fontsize=14&hidenavigation=1&theme=dark"
     style="width:80%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="purple-silence-ikqiv"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>


We define our main model class, `MusicBoxModel` as a subclass of `Model`. Each ball has x and y coordinates and whether it is being manipulated by another participants.

The model has methods for each type of user interaction, such as `grab`, `move`, `addBall`, etc.  `wrap()` is called every 2000 milliseconds and publishes a message called `wrap`.

```
class MusicBoxModel extends Model {
```

The `balls` is a `Map` of the type `Map<BallId, BallData>`. The `move() method` for example receives a new ball position from a participant, update balls, and publishes a "moved" message with the same argument.

Moving over to the view side, we first define our top-level component, `MusicBoxApp`, which starts a Croquet session.

```
function MusicBoxApp() {
  return (
    <InCroquetSession name="musicbox" tps={10} apiKey="1_k2xgbwsmtplovtjbknerd53i73otnqvlwwjvix0f" appId="io.croquet.react.codesandbox.musicbox" password="abc" model={MusicBoxModel} eventRateLimit={60}}>
      <MusicBoxField/>
    </InCroquetSession>
  );
}
```

The view side logic is written in the `MusicBoxField` component. For the view to quickly rerender without having to wait for a network round trip, the component has a state called viewBalls, that is "almost" the copy of the model's `balls`, except the modification occurred in the local view. Because balls maybe added and deleted, the data structure is a `Map`, but to obey React's state update rule, we wrap it in an object.

```
 const [viewBalls, setViewBalls] = useState<{data: Map<BallId, BallData>}>({data: new Map(model.balls)});
```

grabInfo stores the transient state when a ball is grabbed in the view.

```
  const [grabInfo, setGrabInfo] = useState<{data: Map<PointerId, {ballId:BallId, grabPoint:Point, translation:Point}>}>({data: new Map()});
```

The component subscribes to the message for each interaction.

```
  useSubscribe<number>(model.id, "wrap", (time) => setWrapTime(time));
  useSubscribe<GrabData>(model.id, "grabbed", grabBall);
  useSubscribe<MoveData>(model.id, "moved", moveBall);
  useSubscribe<GrabData>(model.id, "released", releaseBall);
  useSubscribe<MoveData>(model.id, "added", addBall);
  useSubscribe<GrabData>(model.id, "removed", removeBall);
```

Notice that `useSubscribe` has type parameter to ensure that handlers have the matching types.

A handler, such as `moveBall`, is defined as follows:
```
  const moveBall = useCallback((data:MoveData, viewSide?:boolean) => {
    const {viewId, id, x, y} = data;

    if (!viewSide && viewId === myViewId) {return;}

    setViewBalls((oldViewBalls) =>{
      const map = oldViewBalls.data;
      map.set(id, {x, y, grabbed: viewId});
      return {data: map};
    });
  }, [myViewId]);
```

As described later, the same function is called from the view side event handler as well. the second argument specifies if it is handling the view side event or not. The call to `setViewBalls` state updater mutates the wrapped Map but create a new object to trigger rerender.

We also define publish hooks.

```
  const publishGrab = usePublish<GrabData>((id) => [model.id, 'grab', {viewId: myViewId, id}]);
  const publishMove = usePublish<MoveData>((id, newTranslation) => {
    return [model.id, 'move', {viewId: myViewId, id, x: newTranslation.x, y: newTranslation.y}]});
  const publishRelease = usePublish<GrabData>((id) => [model.id, 'release', {viewId: myViewId, id}]);
  const publishAddBall = usePublish((x, y) => [model.id, 'addBall', {viewId: myViewId, x, y}]);
  const publishRemoveBall = usePublish<GrabData>((id) => [model.id, 'removeBall', {id, viewId: myViewId}]);
```

The functions takes some arguments such as `id`, or `x, y` and publish a message. The type parameter for usePublish ensures that the data to be publised conforms the type. 

There are three event handlers. Due to the platform neutral synthetic event restriction, and to the need for allowing the MusicBoxField to be transformed according to different screen sizes of participants, we need to attach the event handlers to MusicBoxField, and do hit detection by ourselves with the `findBall()` function. The `pointerDown` callback, for example, computes the original translation in the reference of the MusicBoxField.  Then update the grabInfo state, first by directly mutating data in the wrapped Map then calling `setGrabInfo`.  The call to `grabBall()` has the second argument (`viewSide`) so it updates the `viewBalls` data before publishing a message by `publishGrab`.


```
  const pointerDown = useCallback((evt) => {
    enableSound();
    const x = evt.nativeEvent.offsetX;
    const y = evt.nativeEvent.offsetY;
    const pointerId:PointerId = evt.pointerId;
    const balls = model.balls;
    const entry = findBall(x, y, balls);
    if (!entry) {return;}
    const [ballId, ballData] = entry;
    if (ballData.grabbed && ballData.grabbed !== myViewId) {return;}
    const info = grabInfo.data.get(pointerId);
    if (info) {return;}
    const g = {ballId: entry[0], grabPoint: {x: x, y: y} as Point, translation: {x: ballData.x, y: ballData.y} as Point};

    grabInfo.data.set(evt.pointerId, g);
    setGrabInfo({data: grabInfo.data});
    grabBall({viewId: myViewId, id: ballId}, true);

    publishGrab(ballId);
    evt.target.setPointerCapture(evt.pointerId);
  }, [grabInfo, findBall, grabBall, model.balls, publishGrab, myViewId]);
```

Because we want to keep moving the bar smoothly in the view side, we need to tap into the `Croquet.View`'s `update()` method. The `useUpdateCallback` hook "injects" a function into `update() and have it invoked for each `update()` call. The argument for it typically needs to be a fresh function, thus defined as a function in the component.

```
useUpdateCallback(update);
```

There are other hooks to handle `synced` event and `detach()` method invocation. In the example, we use `useSyncedCallback` to log a message to console.

```
 useSyncedCallback((flag:boolean) => {
    console.log("synced", flag, barPos);
  });
```

At each rendering, we compute the appropriate scale for the field, update the list of `Ball` components and include them.

A Word of caution, however, is that a Croquet application may as well be easier to develop on top of the vanilla Croquet library or the Virtual DOM framework. As you can see above, the view side smoothing logic requires a separate data source for components and that involves inherently imperative style of udpate.  Creating a list of objects may be changed more than one client, and that entails to create the list of elements all the time. A careful deliberation on the trade-offs between frameworks is something one should do before picking the `@croquet/react` framework.