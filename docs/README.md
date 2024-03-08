# About the docs

The docs are deployed at https://croquet.io/docs/croquet-react

Pre-release docs are at https://croquet.io/dev/docs/croquet-react

The docs are generated from the files in this directory using the [Croquet docs generator](https://github.com/croquet/croquet-docs) which has the corresponding JSDoc definitions and theme.

# How to update docs

To update the content, edit the files in this directory:

* `react-doc.js` defines the API and is the source for JSDoc
* `top.md` is the source for the main page
* `tutorials/*.md` has each of the tutorials

To preview/generate/deploy the docs, they need to be rendered into HTML.

## Docs rendering

### Initial setup

To generate the HTML, clone https://github.com/croquet/croquet-docs next to `croquet-react`:

    ├── croquet-react/          # repo clone
    │
    └── croquet-docs/           # repo clone

Then

    cd croquet-docs
    npm i

### Building the react docs

    cd croquet-docs/croquet-react
    npm run build

This will generate the docs into `../dist/croquet-react/`:

    ├── croquet-react/              # repo clone
    │   └── docs/
    │       ├── top.md              # becomes index.html
    │       ├── react-doc.js        # becomes global.html
    │       └── tutorials/
    │           └── *.md            # becomes tutorial-*.html
    │
    └── croquet-docs/               # repo clone
        ├── croquet-react/
        │   └── jsdoc.json          # build definition for react docs
        │
        ├── clean-jsdoc-theme       # theme files for all docs
        │
        └── dist/
            └── croquet-react/      # generated react docs
                ├── index.html
                ├── global.html
                └── tutorial-*.html

### Continuous rebuilding

While developing, it is useful to have the HTML files get generated continuously. This command will start a watcher and run the build whenever one of the source files changes:

    cd croquet-docs/croquet-react
    npm run watch

Open a browser on one of the generated HTML files, and reload it after changing one of the source files.