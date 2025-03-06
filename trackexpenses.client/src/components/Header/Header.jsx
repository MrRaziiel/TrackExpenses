import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../Authentication/AuthContext";
import { theme } from "../Theme/Theme";

export const Header = () => {
  const [active, setActive] = useState("Home");
  const { user } = useAuth();

  return (
    <nav style={{ backgroundColor: theme.colors.backgroundMenus, borderColor: theme.colors.border }} className="p-4 border-b">
      <div className="flex items-center justify-between mx-auto">
        <Link to="/" style={{ color: theme.colors.primary }} className="text-2xl font-semibold">
          TRACKEXPENSES
        </Link>

        <div className="flex-grow flex justify-center">
          <ul className="flex space-x-6 font-medium items-center">
            {["Home", "Expenses", "Services", "Pricing"].map((item) => (
              <li key={item}>
                <Link to={`/${item.toLowerCase()}`}>
                  <button
                    style={{
                      backgroundColor: active === item ? theme.colors.button : "transparent",
                      color: active === item ? "white" : theme.colors.textSecondary,
                      borderRadius: "6px",
                      padding: "8px 16px",
                    }}
                    className="transition-all hover:bg-gray-300"
                    onClick={() => setActive(item)}
                  >
                    {item}
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span style={{ color: theme.colors.textSecondary }}>Welcome, {user.name}!</span>
              <button
                onClick={() => console.log("Logout")}
                style={{ backgroundColor: theme.colors.dangerRed, color: "white" }}
                className="py-2 px-4 rounded-md hover:bg-darkRed"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/signin">
                <button
                  style={{ backgroundColor: theme.colors.button, color: "white" }}
                  className="py-2 px-4 rounded-md hover:bg-buttonHover"
                >
                  SignIn
                </button>
              </Link>
              <Link to="/login">
                <button
                  style={{ backgroundColor: theme.colors.button, color: "white" }}
                  className="py-2 px-4 rounded-md hover:bg-buttonHover"
                >
                  Login
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
