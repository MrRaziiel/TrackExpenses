import React from "react";
import { Link } from "react-router-dom";
import { Menu as MenuIcon, Wallet } from "lucide-react";

export default function TopBar({ title, rightSlot, onToggleSideBar }) {
  return (
    <nav className="text-white shadow-lg" style={{ backgroundColor: "#3B82F6" }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-blue-600 transition-colors"
            onClick={onToggleSideBar}
            aria-label="Menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>

        <Link to="/" className="flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          <span className="font-bold text-xl hidden sm:inline">{title}</span>
        </Link>
        </div>

        <div className="flex items-center">{rightSlot}</div>
      </div>
    </nav>
  );
}
