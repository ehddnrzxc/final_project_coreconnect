import React from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

const Shell = ({ children, onLogout, avatarUrl }) => (
  <div className="app">
    <Topbar onLogout={onLogout} avatarUrl={avatarUrl} />
    <div className="layout">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  </div>
);

export default Shell;