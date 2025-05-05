import { useState } from "react";
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleClick() {
    navigate("/signin");
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
    <div className="p-8">
      <h2 className="text-2xl font-bold text-center mb-8">
        Login</h2>
        <div className="mb-4">
          <label className="block text-gray-800 font-semibold">Email</label>
          <input
            type="email"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-800 font-semibold">Password</label>
          <input
            type="password"
            className="w-full p-2 border border-gray-300 rounded mt-1"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button 
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
          login
        </button>
      </div>
      <div className="mt-6 text-center">
          <button
            onClick={handleClick}
            className="text-blue-500 hover:text-blue-600"
          >
            Don't have an account? Sign Up"
          </button>
        </div>
    </div>
  );
};

export default Login;
