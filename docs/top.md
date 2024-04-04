The Croquet React bindings is a simple framework for using Croquet together with React.js. It allows to write the Croquet's View side code in React that works with the Croquet Model code.
This documentation assumes that you are familiarized with Croquet's [main concepts](../croquet/index.html#main-concepts) and how [views](../croquet/index.html#views) and [models](../croquet/index.html#models) interact via [events](../croquet/index.html#events).

## Overview

The [`@croquet/react`](https://www.npmjs.com/package/@croquet/react) package provides a simple framework for using Croquet together with React.
The main principle of [`@croquet/react`](https://www.npmjs.com/package/@croquet/react) is that React components fully assume the role of the [View](../croquet/index.html#views) side of Croquet.
Behind the scenes, a normal Croquet View is still created to act as a slim contact point between the Croquet [Model](../croquet/index.html#models) and the React components, but all View side logic is implemented in the React components.

React components interact with Croquet using **hooks** for accessing the features the Croquet Library offers, such as subscribing to model events or publishing events among models and other views. These tutorials assume that you are familiar with the "functional-component + hooks" style of writing React apps. If you aren't, [the official React tutorial on hooks](https://react.dev/reference/react/hooks) is a good starting point.

## Tutorials

You can start by taking the tutorials of simple application examples in the "Tutorials" section in the navigation bar.

* [Simple Counter]{@tutorial 1_React_Simple_Counter}
* [Music Box]{@tutorial 2_React_Music_Box}
* [Mondrian]{@tutorial 3_0_React_Mondrian}

## Documentation

The [documentation](./global.html) contains minimal usage examples, which will also be displayed in IDE's such as VS Code with full TypeScript declarations.  The type annotations for `publish` and `subscribe` help to ensure the data sent and received conforms to the same type, for instance.