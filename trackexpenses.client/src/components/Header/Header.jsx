import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../Authentication/AuthContext";

export const Header = () => {
  const [active, setActive] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth(); // Obtém o utilizador autenticado

  return (
    <nav className="bg-gray-900 border-gray-700">
      <div className="flex items-center justify-between mx-auto p-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-semibold text-blue-500 pr-5">
          TRACKEXPENSES
        </Link>

        {/* Menu Container */}
        <div className="flex-grow flex justify-center">
          <ul className="flex space-x-6 font-medium items-center">
            {["Home", "Expenses", "Services", "Pricing"].map((item) => (
              <li key={item}>
                <Link to={`/${item.toLowerCase()}`}>
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
        </div>

        {/* Authentication Buttons */}
        <div className="flex items-center space-x-4">
          {!user ? (
            <>
              <Link to="/signin">
                <button className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  SignIn
                </button>
              </Link>
              <Link to="/login">
                <button className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Login
                </button>
              </Link>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <span className="text-white">Welcome, {user.name}!</span>
              <button
                onClick={() => console.log("Logout")}
                className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
