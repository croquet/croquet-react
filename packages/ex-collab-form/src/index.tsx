import React from 'react';
import ReactDOM from 'react-dom';
import {
    InCroquetSession,
    useModelRoot,
    useModelState,
} from '@croquet/react';
import { Model } from '@croquet/croquet';

class CollabFormModel<F extends { [fieldName: string]: any }> extends Model {
    fields!: Partial<F>;

    init() {
        this.fields = {};
        this.subscribe(this.id, 'setField', this.setField);
    }

    setField<N extends keyof F>({ name, value }: { name: N; value: F[N] }) {
        this.fields[name] = value;
    }
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
    const form = useModelState(useModelRoot<
        CollabFormModel<{ name: string; email: string; age: number }>
    >());

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
                        value={form.fields.name}
                        onChange={(e) => form.change.setField({name: 'name', value: e.target.value})}
                    />
                </label>
            </p>
            <p>
                <label>
                    Email
                    <input
                        type="email"
                        value={form.fields.email}
                        onChange={(e) => form.change.setField({name: 'email', value: e.target.value})}
                    />
                </label>
            </p>
            <p>
                <label>
                    Age
                    <input
                        type="number"
                        value={form.fields.age}
                        onChange={(e) =>
                            form.change.setField({name: 'age', value: parseInt(e.target.value, 10)})
                        }
                    />
                </label>
            </p>
        </form>
    );
};

ReactDOM.render(<App />, document.getElementById('app'));
