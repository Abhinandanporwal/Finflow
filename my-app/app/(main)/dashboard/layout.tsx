import React, { Suspense } from "react";
import DashboardPage from "./page";
import { BarLoader } from "react-spinners";

export default function MainLayout(): React.ReactElement {
  return React.createElement(
    "div",
    { className: "py-20 px-5" },
    React.createElement("h1", { className: "text-6xl font-bold gradient-text mb-5" }, "Dashboard"),
    React.createElement(
      Suspense,
      { fallback: React.createElement(BarLoader, { className: "mt-4", width: "100%", color: "#9333ea" }) },
      React.createElement(DashboardPage)
    )
  );
}
