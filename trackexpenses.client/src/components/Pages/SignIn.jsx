import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const SignIn = () => {

  const navigate = useNavigate();
  const [configurationPage, setConfigurationPage] = useState([
    { label: "FirstName", lower: "firstname", spaced: "First Name", Required: true, value: "" },
    { label: "FamilyName", lower: "familyname", spaced: "Family Name", Required: true, value: "" },
    { label: "Email", lower: "email", spaced: "Email", Required: true, value: "" },
    { label: "Date", lower: "date", spaced: "Date", Required: false, value: "" },
    { label: "Password", lower: "password", spaced: "Password", Required: true, value: "" },
    { label: "ConfirmPassword", lower: "confirmpassword", spaced: "Confirm Password", Required: true, value: "" },
    { label: "GroupCode", lower: "groupcode", spaced: "Group Code", Required: false, value: "" },
  ]);
  
  const handleInputChange = (e, index) => {
    const newConfiguration = [...configurationPage];
    newConfiguration[index].value = e.target.value;
    setConfigurationPage(newConfiguration);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const payload = configurationPage.reduce((acc, field) => {
      acc[field.lower] = field.value;
      return acc;
    }, {});

 

    const res = await fetch('/api/auth/SignIn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      navigate('/login');
    } else {
      alert('Registration failed');
    }
  };
  function handleClick() {
    navigate("/login");
  }

  return (
    <div className="max-w mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-center mb-8">
          -Create Account
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
        {configurationPage.map((value, index) => (
        <div key={index} className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            {value.spaced}
          </label>
          <input
            type="text"
            name={value.name || `input-${index}`}
            placeholder={`Enter your ${value.spaced || ''}`}
            onChange={(e) => handleInputChange(e, index)} // assuming you have this handler
            className="w-full p-3 border border-inputBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocus text-text"
            required={value.Required}
          />
        </div>
        ))}

        </div>
        
        <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            className="text-blue-500 hover:text-blue-600"
            onClick={handleClick}
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  )};

  export default SignIn;