import React from "react";
import { Link } from "react-router-dom";
import { Menu as MenuIcon, Wallet } from "lucide-react";

export default function TopBar({ title, rightSlot, onToggleSideBar }) {
  return (
    <nav className="text-white shadow-lg relative" style={{ backgroundColor: "#3B82F6" }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center h-16">
        {/* Botão à esquerda */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-blue-600 transition-colors"
            onClick={onToggleSideBar}
            aria-label="Menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Título centrado */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <Link to="/" className="flex items-center gap-2 pointer-events-auto">
            <Wallet className="h-6 w-6" />
            <span className="font-bold text-xl">{title}</span>
          </Link>
        </div>

        {/* Slot à direita (se precisares no futuro) */}
        <div className="ml-auto">{rightSlot}</div>
      </div>
    </nav>
  );
}
