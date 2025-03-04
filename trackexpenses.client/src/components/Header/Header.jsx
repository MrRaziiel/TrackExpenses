import { Link } from "react-router-dom";
import { useState } from "react";

export const Header = () => {
  const [active, setActive] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 border-gray-700">
      <div className="max-w-screen-xl flex items-center justify-between mx-auto p-4">
        {/* Logo */}
        <a href="#" className="text-2xl font-semibold text-blue-500 pr-10 md:pr-20">
          TRACKEXPENSES
        </a>

        {/* Menu Responsivo */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-400 rounded-lg hover:bg-gray-700"
        >
          <span className="sr-only">Open menu</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        {/* Menu */}
        <div className={`${menuOpen ? "block" : "hidden"} w-full md:flex md:items-center md:justify-between`}>
          <ul className="flex flex-col md:flex-row md:space-x-3 font-medium mt-4 md:mt-0">
            {["Home", "Expenses", "Services", "Pricing"].map((item) => (
              <li key={item}>
                <Link to={`/${item}`}>
                  <button
                    className={`py-2 px-4 rounded-md transition-all ${
                      active === item ? "bg-blue-800 text-white" : "text-white"
                    } hover:bg-gray-700`}
                    onClick={() => {
                      setActive(item);
                      setMenuOpen(false);
                    }}
                  >
                    {item}
                  </button>
                </Link>
              </li>
            ))}
          </ul>

          {/* Login / SignIn */}
          <div className="space-x-4 mt-4 md:mt-0">
            <Link to="/SignIn">
              <button className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">SignIn</button>
            </Link>
            <Link to="/login">
              <button className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Login</button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
