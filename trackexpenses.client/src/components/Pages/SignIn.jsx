// src/pages/SignIn.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../hooks/apiCall';
import { AuthContext } from '../Authentication/AuthContext';  // correct path to AuthContext

const SignIn = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [firstConfiguration] = useState([
    { label: "Email", lower: "email", placeholder: "me@example.org", Required: true, type: "email" , pattern:"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$", value: "" },
    { label: "Password", lower: "password", placeholder: "****************", Required: true, type: "password", pattern:"", value: "" },
    { label: "ConfirmPassword", lower: "confirmpassword", placeholder: "****************", Required: true, type: "password", pattern:"", value: "" },]);
  const [secondconfigurationPage] = useState([
    { label: "FirstName", lower: "firstname", placeholder: "First Name", Required: true, type: "text" , pattern:"", value: "" },
    { label: "FamilyName", lower: "familyname", placeholder: "Family Name", Required: true, type: "text", pattern:"", value: "" },
    { label: "Date", lower: "date", placeholder: "Date", Required: false, type: "date" , pattern:"", value: "" },
    { label: "Phone", lower: "phone", placeholder: "Phone", Required: false, type: "tel", pattern:"[0-9]{3}-[0-9]{2}-[0-9]{3}", value: "" },
    { label: "Photopath", lower: "Photopath", placeholder: "Photopath", Required: true, pattern:"", value: "" },
    { label: "GroupCode", lower: "groupcode", placeholder: "Group Code", type: "Text" , Required: false, pattern:"", value: "" },
  ]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (formData.email == null || !String(formData.email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )){
      setError("Mail invalid: 'example@example.com'")
      return
    }
    if (formData.password == null || formData.confirmpassword == null || formData.password != formData.confirmpassword) {
      setError("As senhas não coincidem");
      return;
    }
    setError(null);
    setStep(2);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const allFields = [...configurationPageFirst, ...configurationPageSecond];
    const payload = allFields.reduce((acc, field) => {
      acc[field.lower] = field.value;
      return acc;
    }, {});

    try {
      const res = await apiClient.post('/auth/login', payload);
      setUser(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const renderFields = (fields) =>
    fields.map((field) => (
      <div key={field.lower} className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
        </label>
        <input
          type={field.type || "email"}
          name={field.lower}
          placeholder={`${field.placeholder}`}
          value={formData[field.lower] || ""}
          onChange={handleChange}
          className="w-full p-3 border border-inputBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocus text-text"
          required={field.Required}
          pattern={field.pattern || undefined}
        />
      </div>
    ));


  return (
    <div className="max-w mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Sign In</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {step ===1 && (
            <>
             {renderFields(firstConfiguration)}
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="button"
            onClick={handleNext}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Próximo
          </button>

            </>
          )}
           {step ===2 && (
            <>
        <div className="grid grid-cols-3 gap-4 auto-cols-[5]">
        {renderFields(secondconfigurationPage)}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Finalizar
            </button>
          </div>
          </div>


          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sign In
          </button>
          {error && <p className="text-red-500 mt-2">Erro: {error}</p>}
          </>
        )}
        </form>

        <div className="mt-6 text-center">
          <Link className="text-blue-500 hover:text-blue-600" to="/login">
            Don’t have an account? Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;