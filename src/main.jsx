import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { loadTheme } from "./lib/theme";
import App from "./App";
import "./styles.css";

document.documentElement.dataset.uiTheme = loadTheme();

// Совпадает с base в Vite: "/" локально, "/quiz-mix/" при сборке под GitHub Pages
const baseUrl = import.meta.env.BASE_URL;
const routerBasename = baseUrl === "/" ? undefined : baseUrl.replace(/\/$/, "");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBasename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
