# croquet-react

React bindings for [Croquet](https://croquet.io/docs/croquet/).

Magically synced app state for no-backend multiplayer experiences.

## Installation

```npm i @croquet/croquet-react @croquet/croquet```

## What's included

`croquet-react` is a thin wrapper around `croquet`, providing mainly:
- the `useModelState` hook for conveniently **rerendering** components **on Model changes**
- the `useSubscribe` hook for **rerendering** components **when Croquet events are fired**
- the `usePublish` that returns a stable **callback which fires Croquet events**, similar to the `useCallback` builtin hook
- the `InCroquetSession` component, providing Croquet session context and configuration to its children, which may then use the hooks mentioned above.

## API Documentation

## Examples

## Usage & motivation

Croquet works with plain JS/DOM, but since it it already has a separation of [Models](https://croquet.io/docs/croquet/Model.html) and [Views](https://croquet.io/docs/croquet/View.html), it works well with reactive view-side frameworks like React.

These bindings let you write your Croquet view-side in familar, idiomatic React that scales to complex applications, and gives you access to React's huge ecosystem.

If you are a **React developer and not too familiar with Croquet yet,** think of  Croquet as an application state library for React that:

- has a **familar API with read-only state**, that is modified only through actions (= Croquet events that Models subscribe to)
- **magically syncs** this state among session participants, letting you **create real-time multiplayer experiences** without writing any backend code or syncing logic.

If you have written plain Croquet apps before, you will notice that with `croquet-react` you can
- write your app's view-side much more succinctly
- use the provided hooks to **reactively** rerender your view on any model change
- stop updating the UI explicitly through extra notification events and get rid of the corresponding boilerplate

## TypeScript support

- all the provided hooks are generic over subclasses of Model, letting you declare the precise expected type on hooks that return Model state
- referenced sub-Models thus also have their precise types

Future plans / currently investigating:

- Precise typing of available event signatures for publishing/subscribing

