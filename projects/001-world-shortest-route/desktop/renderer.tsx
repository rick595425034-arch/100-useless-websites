import React from "react";
import { createRoot } from "react-dom/client";
import { ShortestRouteLab } from "../app/ShortestRouteLab";
import "../app/globals.css";

document.body.classList.add("desktop-shell");

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ShortestRouteLab />
  </React.StrictMode>,
);
