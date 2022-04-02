import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { InCroquetSession, useModelRoot, useModelState } from '@croquet/react';
import { Model } from '@croquet/croquet';
import { Tldraw, TDDocument, TldrawApp, TDShape} from '@tldraw/tldraw'

class TldrawModel extends Model {
    shapes!: Record<string, TDShape>;
    bindings!: Record<string, TDShape>;

    init() {
        this.shapes = {};
        this.bindings = {};
        this.subscribe(this.id, 'updateShape', this.updateShape);
    }

    updateShape({id, shape}: {id: string, shape: TDShape | undefined}) {
        console.log("got update shape", id, shape);
        if (shape) {
            this.shapes[id] = shape;
        } else {
            delete this.shapes[id]
        }
    }
}

TldrawModel.register("TldrawModel");

const App = function () {
    return (
        <InCroquetSession
            model={TldrawModel}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-example-tldraw"
        >
            <TldrawView/>
        </InCroquetSession>
    );
};

const TldrawView = function () {
    const documentFromCroquet = useModelState(useModelRoot<TldrawModel>());

    const [document, setDocument] = useState<TDDocument>({
        id: "doc1",
        version: TldrawApp.version,
        name: "multiplayer-test",
        pages: {
            page1: {
                id: "page1",
                shapes: {},
                bindings: {},
            }
        },
        pageStates: {
            page1: {
              id: 'page1',
              selectedIds: [],
              camera: {
                point: [0, 0],
                zoom: 1,
              },
            },
          },
          assets: {}
    });

    useEffect(() => {
        console.log("got new document", documentFromCroquet);
        setDocument(document => ({...document, pages: {page1: {...document.pages.page1, shapes: documentFromCroquet.shapes}}}));
    }, [documentFromCroquet]);

    return <Tldraw
        showPages={false}
        showMenu={false}
        onChangePage={(app, shapes, bindings) => {
            console.log(shapes, bindings);
            // optimistic preview
            // setDocument(app.document);

            for (let [id, shape] of Object.entries(shapes)) {
                documentFromCroquet.change.updateShape({id, shape})
            }
        }}
        disableAssets={true}
        document={document}
    />
}

ReactDOM.render(<App />, document.getElementById('app'));
