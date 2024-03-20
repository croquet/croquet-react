In this tutorial, we implement a simple multiplayer music box to illustrate realtime view side update and how to use other hooks.
We also use TypeScript in this example.
The source code is available on [Github](https://github.com/yoshikiohshima/react-musicbox).

The app has a number of "balls", each of which represents the timing and pitch of a note. A participant can manipulate them to compose a loop. The timing for the bar to wrap is synchronized by the model side logic, but the view interpolates the position of the bar and plays a sound when the bar passes a ball.

<iframe src="../../react-musicbox"
     style="width:80%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>


We define our main model class, `MusicBoxModel` as a subclass of `Model`. The model contains a set of balls stored in `Map<BallId, BallData>`, keyed by a `BallId`-type value and logical position and the state of interaction of the ball as the value. The balls may be added and deleted and we still have to enumerate them in deterministic order; this is another reason why we use a Map.

The model has methods for each type of user interaction, such as `grab`, `move`, `addBall`, etc.  `wrap()` is called every 2000 milliseconds and publishes a message called `wrap`.

```
class MusicBoxModel extends Model {
  width = 720;
  height = 480;
  wrapTime = 0;
  balls: Map<BallId, BallData> = new Map();
  currentId = 0;
```

The `move() method`, for example, receives a new ball position from a participant, update balls, and publishes a "moved" message with the same argument.

```
move(data: MoveData) {
    const { viewId, id, x, y } = data;
    const ball = this.balls.get(id);
    if (!ball) {
      return;
    }
    if (ball.grabbed !== viewId) {
      return;
    }
    ball.x = x;
    ball.y = y;
    this.publish(this.id, "moved", data);
  }
```

Moving over to the view side, we first define our top-level component, `MusicBoxApp`, which starts a Croquet session. We use Vite's feature to configure parameters. You can use different mechanisms or just hardcode your configuration if you use a different bundler.

```
function MusicBoxApp() {
  return (
    <InCroquetSession
      name={import.meta.env["VITE_CROQUET_APP_NAME"] || CroquetApp.autoSession("q")}
      apiKey={import.meta.env["VITE_CROQUET_API_KEY"]}
      tps={0.5}
      appId={import.meta.env["VITE_CROQUET_APP_ID"] || "io.croquet.react.musicbox"}
      password={import.meta.env["VITE_CROQUET_PASSWORD"] || CroquetApp.autoPassword()}
      model={MusicBoxModel}
      eventRateLimit={import.meta.env["EVENT_RATE_LIMIT"] || 60}>
       <MusicBoxField />
    </InCroquetSession>
  );
}
```

The view side logic is written in the `MusicBoxField` component. For the view to rerender without having to wait for a network round trip, the component has a state called `viewBalls`, which is "almost" the copy of the model's `balls`, except that modifications occur in the local view are included. Because balls may be added and deleted, the data structure is a `Map`, but to obey React's state update rule, we wrap it in an object.

```
 const [viewBalls, setViewBalls]
    = useState<{data: Map<BallId, BallData>}>({data: new Map(model.balls)});
```

grabInfo stores the transient state when a ball is grabbed by the local user.

```
  const [grabInfo, setGrabInfo]
    = useState<{data: Map<PointerId, {ballId:BallId, grabPoint:Point, translation:Point}>}>({data: new Map()});
```

The component subscribes to the message for each type of interaction, beside the `wrap` message.

```
  useSubscribe<number>(model.id, "wrap", (time) => setWrapTime(time));
  useSubscribe<GrabData>(model.id, "grabbed", grabBall);
  useSubscribe<MoveData>(model.id, "moved", moveBall);
  useSubscribe<GrabData>(model.id, "released", releaseBall);
  useSubscribe<MoveData>(model.id, "added", addBall);
  useSubscribe<GrabData>(model.id, "removed", removeBall);
```

Notice that each call to `useSubscribe` has a type parameter to ensure that handlers have matching types.

A message handler, such as `moveBall`, is defined as follows.
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

As described later, the same `moveBall` function is called directly from the view side user event handler as well. The second argument specifies if it is handling the view side event or a Croquet message from the model. The call to `setViewBalls` state updater mutates the wrapped `Map` but creates a new object to trigger rerendering.

We also define publish hooks.

```
  const publishGrab = usePublish<GrabData>((id) => [
    model.id, 'grab', {viewId: myViewId, id}]);
  const publishMove = usePublish<MoveData>((id, newTranslation) => [
    model.id, 'move', {viewId: myViewId, id, x: newTranslation.x, y: newTranslation.y}]});
  const publishRelease = usePublish<GrabData>((id) => [
    model.id, 'release', {viewId: myViewId, id}]);
  const publishAddBall = usePublish((x, y) => [
    model.id, 'addBall', {viewId: myViewId, x, y}]);
  const publishRemoveBall = usePublish<GrabData>((id) => [
    model.id, 'removeBall', {id, viewId: myViewId}]);
```

The functions take some arguments such as `id`, or `x, y` and publish a message. The type parameter for `usePublish` ensures that the data to be publised conforms to the type. 

There are three user event handlers, namely `pointerDown`, `pointerMove` and `pointerUp`. We use `pointerEvents` to support multi touch interaction . Due to React's platform-neutral synthetic event restrictions, and due to the need for allowing the `MusicBoxField` to be transformed to fit into different screen sizes of participants, we need to attach the event handlers to the `MusicBoxField` component, and implement the hit detection logic ourselves in the `findBall()` function. The `pointerDown` callback, for example, computes the original translation in the reference of the MusicBoxField, updates the grabInfo state, first by directly mutating data in the wrapped `Map`, then by calling `setGrabInfo`. The call to `grabBall()` has the second argument (`viewSide`) so it updates the `viewBalls` data before publishing a message by calling `publishGrab`.

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
    const g = {ballId: entry[0], grabPoint: {x: x, y: y} as Point,
               translation: {x: ballData.x, y: ballData.y} as Point};

    grabInfo.data.set(evt.pointerId, g);
    setGrabInfo({data: grabInfo.data});
    grabBall({viewId: myViewId, id: ballId}, true);

    publishGrab(ballId);
    evt.target.setPointerCapture(evt.pointerId);
  }, [grabInfo, findBall, grabBall, model.balls, publishGrab, myViewId]);
```

The `pointerMove` handler follows the similar structure. The latter part computes the new position for the ball, move the ball locally by calling `moveBall()` with the second argument, and publish the `move` message to other participants.

```
  const pointerMove = useCallback((evt) => {
    if (evt.buttons === 0) {return;}
    const pointerId:PointerId = evt.pointerId;
    const info = grabInfo.data.get(pointerId);
    if (!info) {return;}
  
    const ball = model.balls.get(info.ballId);
    if (!ball) {return;}
    if (ball.grabbed && ball.grabbed !== myViewId) {return;}

    let x = evt.nativeEvent.offsetX - info.grabPoint.x + info.translation.x;
    let y = evt.nativeEvent.offsetY - info.grabPoint.y + info.translation.y;
    if (x <= 0) {x = 0;}
    // if (x > model.width - BallDiameter) {x = model.width - BallDiameter;}
    if (y <= 0) {y = 0}
    if (y > model.height - BallDiameter * 2) {y = model.height - BallDiameter * 2;}

    moveBall({x, y, viewId: myViewId, id: info.ballId}, true);
  
    publishMove(info.ballId, {x, y});
  }, [grabInfo, moveBall, publishMove, model.height, model.balls, myViewId]);

```

An important part is the condition in the middle.
```
    const ball = model.balls.get(info.ballId);
    if (!ball) {return;}
    if (ball.grabbed && ball.grabbed !== myViewId) {return;}
```

Imagine if two or more participants tried to click on the same ball almost at the same time.  The `pointerDown` handler for each participant would successfully store data into `grabInfo`, and then publishes the `grab` message. However, the reflector decides who actually get there first. Other participants need to stop dragging the ball if the reflector decided against their favor. In the line above, `pointerMove` checks if the data in the model agrees with the local view state, and if not, avoid executing further logic in `pointerMove`.

(Note that this kind of speculative execution is an optimization and may not be always necessary to implement. If you application does not require smooth movement, first write the logic as clean as possible without optimization and try it. Only then consider adding optimizations.)

Because we want the bar to keep moving smoothly at 60 fps (or more), we need to tap into the `Croquet.View`'s `update()` method. The `useUpdateCallback` hook "injects" a function into `update()` and has it invoked from each `update()` call. The argument for the hook typically needs to be a fresh function, thus is defined as a function in the component.

```
useUpdateCallback(update);
```

There are other hooks to handle `synced` event and `detach()` method invocation. In this example, we use `useSyncedCallback` to log a message to the console.

```
 useSyncedCallback((flag:boolean) => {
    console.log("synced", flag, barPos);
  });
```

The `updateCallback` effectively invokes `MusicBoxField` for each animation frame. `MusicBoxField` returns a `Fragment` with an appropriate scale and other style parameters and updated list of `Ball` components.

```
return (
    <>
      <div
        id="field"
        style={style as any}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
      >
        <Bar pos={barPos}></Bar>
        {balls}
      </div>
      <BallContainer publishAddBall={publishAddBall} />
    </>
  );
```

A word of caution here, however, is that a Croquet application may as well be easier to develop on top of the vanilla Croquet library or the Virtual DOM framework. As you can see above, the view side smoothing logic requires a separate data source for components and makes imperative udpates on the data source. Handling a list of components whose properties may be changed by more than one client requires more computation than simply setting values into elements. A careful deliberation on the trade-offs between frameworks is something one should do before picking the `@croquet/react` framework.