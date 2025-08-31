// components/layout/AppShell.jsx
import React, { useState } from "react";
import TopBar from "./TopBar";
import SideBar from "./SideBar";

export default function AppShell({
  topbarTitle = "TRACKEXPENSES",
  sidebarItems = [],
  rightSlot,
  sidebarVisible = true,
  children,
  bg = "#F9FAFB",
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <TopBar
        title={topbarTitle}
        onToggleSideBar={() => setCollapsed((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ⬅️ só renderiza a sidebar se sidebarVisible for true */}
        {sidebarVisible && (
          <SideBar
            items={sidebarItems}
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
          />
        )}

        <main
          className={`flex-1 min-w-0 ${
            sidebarVisible ? "p-4 md:p-8" : "py-8 px-4"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
