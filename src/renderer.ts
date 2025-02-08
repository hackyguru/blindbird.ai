import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./styles/global.css";

const root = createRoot(document.getElementById("app")!);
root.render(React.createElement(App));
