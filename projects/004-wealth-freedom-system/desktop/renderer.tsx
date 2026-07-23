import React from "react";
import { createRoot } from "react-dom/client";
import { WealthFreedomTerminal } from "../app/WealthFreedomTerminal";
import "../app/globals.css";

document.body.classList.add("desktop-shell");

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WealthFreedomTerminal />
  </React.StrictMode>,
);
