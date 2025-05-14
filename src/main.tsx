import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"
// import setupClientProxy from "./server.ts" // Comment out or remove this line

// Replace the existing process polyfill with this more comprehensive one
if (typeof window !== "undefined") {
  // More complete process polyfill for Web3.js
  window.process = {
    env: {},
    nextTick: (fn, ...args) => setTimeout(() => fn(...args), 0),
    version: "",
    versions: { node: "16.0.0" },
    platform: "browser",
    cwd: () => "/",
    emitWarning: () => {},
    binding: () => ({}),
    _tickCallback: () => {},
    hrtime: () => [0, 0],
    // Add these additional properties that Web3.js might be using
    browser: true,
    argv: [],
    stdout: {},
    stderr: {},
    stdin: {},
    release: { name: "node" },
    config: {},
    title: "browser",
  } as any
}

// Remove this line
// setupClientProxy()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
