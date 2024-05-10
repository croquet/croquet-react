import './App.css';
import './style.css';

import {MusicBoxModel} from "./model.js";
import {MusicBoxField} from "./view.tsx";
// console.log(import.meta.env);

import {
  InCroquetSession,
  App as CroquetApp
} from "@croquet/react";

function App() {
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
  )
}

export default App
