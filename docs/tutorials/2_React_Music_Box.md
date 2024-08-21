In this tutorial, we implement a simple multiplayer music box to illustrate realtime view side update and how to use other hooks.
We also use TypeScript in this example.
The source code is available on [GitHub](https://github.com/croquet/croquet-react-musicbox).

The app has a number of "balls", each of which represents the timing and pitch of a note. A participant can manipulate them to compose a loop. The timing for the bar to wrap is synchronized by the model side logic, but the view interpolates the position of the bar and plays a sound when the bar passes a ball.

<iframe src="../../react-musicbox"
     style="width:80%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>


We define our main model class, `MusicBoxModel` as a subclass of `ReactModel`. The model contains a set of balls stored in `Map<BallId, BallData>`, keyed by a `BallId`-type value and logical position and the state of interaction of the ball as the value. The balls may be added and deleted and we still have to enumerate them in deterministic order; this is another reason why we use a Map.

The model has methods for each type of user interaction, such as `grab`, `move`, `addBall`, etc.  `wrap()` is called every 2000 milliseconds and publishes a message called `wrap`.

```
class MusicBoxModel extends ReactModel {
  width = 720;
  height = 480;
  wrapTime = 0;
  balls: Map<BallId, BallData> = new Map();
  currentId = 0;

  // ...
}
```

The `move()` method, for example, receives a new ball position from a participant, update balls, and publishes a "moved" message with the same argument.

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
}
```

Moving over to the view side, we first define our top-level component, `MusicBoxApp`, which starts a Croquet session. We use Vite's feature to configure parameters. You can use different mechanisms or just hardcode your configuration if you use a different bundler.

```
function MusicBoxApp() {
  return (
    <CroquetRoot
      sessionParams={{
        name: import.meta.env["VITE_CROQUET_APP_NAME"],
        apiKey: import.meta.env["VITE_CROQUET_API_KEY"],
        tps: 0.5,
        appId: import.meta.env["VITE_CROQUET_APP_ID"],
        password: import.meta.env["VITE_CROQUET_PASSWORD"],
        model: MusicBoxModel,
        eventRateLimit: import.meta.env["EVENT_RATE_LIMIT"] || 60,
        options: { trackViews: true },
      }}
    >
      <MusicBoxField />
    </CroquetRoot>
  );
}
```

The view side logic is written in the `MusicBoxField` component. We use the `useReactModelRoot` hook to get the model's balls, and to render them:

```
const model = useReactModelRoot<MusicBoxModel>();
const viewBalls = model.balls
```

`grabInfo` stores the transient state when a ball is grabbed by the local user.
Since this state is not intended to be shared within the session, it only exists on the view side.

```
  const [grabInfo, setGrabInfo]
    = useState<Map<pointerId, {ballId:ballId, grabPoint:Point, translation:Point}>>(new Map());
```


There are three user event handlers, namely `pointerDown`, `pointerMove` and `pointerUp`. We use `pointerEvents` to support multi touch interaction . Due to React's platform-neutral synthetic event restrictions, and due to the need for allowing the `MusicBoxField` to be transformed to fit into different screen sizes of participants, we need to attach the event handlers to the `MusicBoxField` component, and implement the hit detection logic ourselves in the `findBall()` function. The `pointerDown` callback, for example, computes the original translation in the reference of the MusicBoxField, updates the grabInfo state, first by directly mutating data in the wrapped `Map`, then by calling `setGrabInfo`. The call to `grabBall()` has the second argument (`viewSide`) so it updates the `viewBalls` data before publishing a message by calling `model.grab`.

```
  const pointerDown = useCallback((evt:PointerEvent) => {
    enableSound();
    const nativeEvent = (evt as unknown as {nativeEvent:PointerEvent}).nativeEvent;
    const x = nativeEvent.offsetX;
    const y = nativeEvent.offsetY;
    const pointerId = evt.pointerId;
    const balls = model.balls;
    const entry = findBall(x, y, balls);
    if (!entry) {return;}
    const [ballId, ballData] = entry;
    if (ballData.grabbed && ballData.grabbed !== viewId) {return;}
    const info = grabInfo.get(pointerId);
    if (info) {return;}
    const g = {ballId: entry[0], grabPoint: {x: x, y: y} as Point, translation: {x: ballData.x, y: ballData.y} as Point};

    // const newGrabInfo = new Map([...grabInfo.entries(), [evt.pointerId, g]]);
    const newGrabInfo = new Map(grabInfo);
    newGrabInfo.set(evt.pointerId, g);
    setGrabInfo(newGrabInfo);
    model.grab({viewId, id: ballId});
    (evt.target as HTMLElement).setPointerCapture(evt.pointerId);
  }, [grabInfo, findBall, model.balls, model.grab, viewId]);
```

The `pointerMove` handler follows the similar structure. The latter part computes the new position for the ball, move the ball locally by calling `moveBall()` with the second argument, and publish the `move` message to other participants.

```
  const pointerMove = useCallback((evt:PointerEvent) => {
    if (evt.buttons === 0) {return;}
    const pointerId = evt.pointerId;
    const info = grabInfo.get(pointerId);
    if (!info) {return;}

    const nativeEvent = (evt as unknown as {nativeEvent:PointerEvent}).nativeEvent;

    let x = nativeEvent.offsetX - info.grabPoint.x + info.translation.x;
    let y = nativeEvent.offsetY - info.grabPoint.y + info.translation.y;
    if (x <= 0) {x = 0;}
    // if (x > model.width - BallDiameter) {x = model.width - BallDiameter;}
    if (y <= 0) {y = 0}
    if (y > model.height - BallDiameter * 2) {y = model.height - BallDiameter * 2;}
    const step = (model.height - BallDiameter * 2) / 12;
    y = Math.floor(y / step) * step;
  
    model.move({viewId, id: info.ballId, x, y})
  }, [grabInfo, model.move, model.height, viewId/*, model.width*/]);

```

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
      <div id="field" style={style as CSSProperties}
        onPointerDown={(pointerDown as unknown) as React.PointerEventHandler<HTMLDivElement>}
        onPointerMove={(pointerMove as unknown) as React.PointerEventHandler<HTMLDivElement>}
        onPointerUp={(pointerUp as unknown) as React.PointerEventHandler<HTMLDivElement>}
      >  
        <Bar pos={barPos}></Bar>
        {balls}
     </div>
     <BallContainer publishAddBall={(x, y) => model.addBall({x, y})} position={scale * model.height + 20}/>
    </>
  );
```

A word of caution here, however, is that a Croquet application may as well be easier to develop on top of the vanilla Croquet library or the Virtual DOM framework. As you can see above, the view side smoothing logic requires a separate data source for components and makes imperative udpates on the data source. Handling a list of components whose properties may be changed by more than one client requires more computation than simply setting values into elements. A careful deliberation on the trade-offs between frameworks is something one should do before picking the `@croquet/react` framework.