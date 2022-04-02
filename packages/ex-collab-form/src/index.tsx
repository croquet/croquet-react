import React from 'react';
import ReactDOM from 'react-dom';
import {
    InCroquetSession,
    useModelRoot,
    usePublish,
    useWatchModel,
} from '@croquet/react';
import { Model } from '@croquet/croquet';

class CollabFormModel<F extends { [fieldName: string]: any }> extends Model {
    fieldState!: Partial<F>;

    init() {
        this.fieldState = {};
        this.subscribe(this.id, 'setField', this.setField);
    }

    setField<N extends keyof F>({ name, value }: { name: N; value: F[N] }) {
        this.fieldState[name] = value;
    }
}

function useCollabForm<F extends { [fieldName: string]: any }>(
    model: CollabFormModel<F>,
): [Partial<F>, <N extends keyof F>(name: N, value: F[N]) => void] {
    const watched = useWatchModel(model);

    const setField = usePublish((name, value) => [
        model.id,
        'setField',
        { name, value },
    ]) as <N extends keyof F>(name: N, value: F[N]) => void;

    return [watched.fieldState, setField];
}

CollabFormModel.register('CollabFormModel');

const App = function () {
    return (
        <InCroquetSession
            model={CollabFormModel}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-example-collab-form"
        >
            <FormView />
        </InCroquetSession>
    );
};

const FormView = function () {
    const [form, setField] = useCollabForm(
        useModelRoot<
            CollabFormModel<{ name: string; email: string; age: number }>
        >(),
    );

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                console.log('Form submission', form);
            }}
        >
            <p>
                <label>
                    Name
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                    />
                </label>
            </p>
            <p>
                <label>
                    Email
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                    />
                </label>
            </p>
            <p>
                <label>
                    Age
                    <input
                        type="number"
                        value={form.age}
                        onChange={(e) =>
                            setField('age', parseInt(e.target.value, 10))
                        }
                    />
                </label>
            </p>
        </form>
    );
};

ReactDOM.render(<App />, document.getElementById('app'));
