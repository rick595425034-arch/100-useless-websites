import React from "react";
import { createRoot } from "react-dom/client";
import { ProblemShrinker } from "../app/ProblemShrinker";
import "../app/globals.css";

document.body.classList.add("desktop-shell");

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ProblemShrinker />
  </React.StrictMode>,
);
