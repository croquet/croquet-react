import React from 'react';
import ReactDOM from 'react-dom';
import {
    InCroquetSession,
    useModelRoot,
    usePublish,
    useSubscribe,
    useViewId,
    useWatchModel,
} from '@croquet/react';
import { Model } from '@croquet/croquet';

class PollModel extends Model {
    prompt?: string;
    options?: string[];
    created?: boolean;
    votes?: { [voter: string]: number };

    init() {
        this.subscribe(this.id, 'setPrompt', this.setPrompt);
        this.subscribe(this.id, 'addOption', this.addOption);
        this.subscribe(this.id, 'setOption', this.setOption);
        this.subscribe(this.id, 'create', this.create);
        this.subscribe(this.id, 'vote', this.vote);
    }

    setPrompt({ prompt }: { prompt: string }) {
        this.prompt = prompt;
    }

    addOption() {
        if (!this.options) this.options = [];
        this.options.push('');
    }

    setOption({ optionIdx, value }: { optionIdx: number; value: string }) {
        if (!this.options) this.options = [];
        this.options[optionIdx] = value;
    }

    create() {
        this.created = true;
    }

    vote({ clientId, optionIdx }: { clientId: string; optionIdx: number }) {
        if (!this.votes) this.votes = {};
        this.votes[clientId] = optionIdx;
    }
}

PollModel.register('PollModel');

const App = function () {
    return (
        <InCroquetSession
            model={PollModel}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-example-poll"
        >
            <PollView />
        </InCroquetSession>
    );
};

const PollView = function () {
    const poll = useWatchModel(useModelRoot<PollModel>());

    const setPrompt = usePublish((prompt) => [
        poll.id,
        'setPrompt',
        { prompt },
    ]);
    const addOption = usePublish(() => [poll.id, 'addOption']);
    const setOption = usePublish((optionIdx, value) => [
        poll.id,
        'setOption',
        { optionIdx, value },
    ]);
    const create = usePublish(() => [poll.id, 'create']);

    const clientId = useViewId();

    const vote = usePublish((optionIdx) => [
        poll.id,
        'vote',
        { clientId, optionIdx },
    ]);

    return poll.created ? (
        <div>
            <h1>{poll.prompt}</h1>
            <ol>
                {poll.options?.map((option, idx) => (
                    <li key={idx}>
                        {option}{' '}
                        {poll.votes?.[clientId] === undefined ? (
                            <button onClick={() => vote(idx)}>Vote</button>
                        ) : (
                            Object.values(poll.votes).filter(
                                (vote) => vote === idx,
                            ).length
                        )}
                    </li>
                ))}
            </ol>
        </div>
    ) : (
        <div>
            Prompt:
            <input
                type="text"
                value={poll.prompt}
                onChange={(event) => setPrompt(event.target.value)}
            />
            <ol>
                {poll.options?.map((option, idx) => (
                    <li key={idx}>
                        <input
                            type="text"
                            value={option}
                            onChange={(event) =>
                                setOption(idx, event.target.value)
                            }
                        />
                    </li>
                ))}
            </ol>
            <button onClick={addOption}>Add Option</button>
            <button onClick={create}>Create Poll</button>
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('app'));
