import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import "./assets/index.css";
import AntdConfigProvider from "./utils/antdConfigProvider";

// Initialize Ant Design config to suppress warnings
import "./utils/antdConfigProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <AuthProvider>
    <AntdConfigProvider>
      <App />
    </AntdConfigProvider>
  </AuthProvider>
);
