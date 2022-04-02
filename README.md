# croquet-react

This repo contains React bindings for Croquet along with example projects.

The main readme is in [./packages/bindings/README.md](./packages/bindings/README.md).

# Building this repo

This repo uses lerna to link the bindings into the example projects
`npm install -g lerna`

**⚠️ Important:** Make sure to install dependencies with hoisting:

`lerna bootstrap --hoist`

This ensures that there is only one copy of `react` and `@croquet/croquet` between the bindings and examples.