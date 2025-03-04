import { useState } from "react";

const SignIn = () => {
  const [form, setForm] = useState({
    firstName: "",
    familyName: "",
    birthday: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Sign Up</h2>

        <form>
          {["First Name", "Family Name", "Birthday", "Password", "Confirm Password"].map((field, index) => (
            <div key={index} className="mb-4">
              <label className="block text-text font-semibold mb-2">{field}</label>
              <input
                type={field === "Birthday" ? "date" : "text"}
                name={field.toLowerCase().replace(" ", "")}
                placeholder={`Enter your ${field.toLowerCase()}`}
                className="w-full p-3 border border-inputBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocus text-text"
                value={form[field.toLowerCase().replace(" ", "")]}
                onChange={handleChange}
              />
            </div>
          ))}

          <button className="w-full p-2 border border-gray-300 rounded mt-1 font-semibold hover:bg-buttonHover transition-all">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;