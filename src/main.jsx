import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 20,
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          color: "#b00020",
          background: "#fff",
          minHeight: "100vh",
        }}>
          <h2>Something went wrong</h2>
          <p>{String(this.state.error && this.state.error.message)}</p>
          <p style={{ fontSize: 12, color: "#555" }}>
            {String(this.state.error && this.state.error.stack)}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

window.addEventListener("error", (event) => {
  const root = document.getElementById("root");
  if (root && !root.innerText.trim()) {
    root.innerHTML =
      '<div style="padding:20px;font-family:monospace;white-space:pre-wrap;color:#b00020;background:#fff;min-height:100vh;"><h2>Load error</h2><p>' +
      String(event.message) +
      "</p></div>";
  }
});
window.addEventListener("unhandledrejection", (event) => {
  const root = document.getElementById("root");
  if (root && !root.innerText.trim()) {
    root.innerHTML =
      '<div style="padding:20px;font-family:monospace;white-space:pre-wrap;color:#b00020;background:#fff;min-height:100vh;"><h2>Load error</h2><p>' +
      String(event.reason && (event.reason.message || event.reason)) +
      "</p></div>";
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
    </ErrorBoundary>
  </React.StrictMode>
);
