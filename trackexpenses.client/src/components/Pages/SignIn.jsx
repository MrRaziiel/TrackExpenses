// src/pages/SignIn.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiCall from '../../hooks/apiCall';
import { AuthContext } from '../Authentication/AuthContext';  // correct path to AuthContext
import { Flashlight } from 'lucide-react';

const SignIn = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [errorEmail, setErrorEmail] = useState(null);
  const [errorPasswordCheck, setErrorPasswordCheck] = useState(null);
  const [errorPasswordMatch, setErrorPasswordMatch] = useState(null);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [formData, setFormData] = useState({});
  const [firstConfigurationPage] = useState([
    { label: "Email", lower: "email", placeholder: "me@example.org", Required: true, type: "email" , value: "" },
    { label: "Password", lower: "password", placeholder: "****************", Required: true, type: "password", pattern: "(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}", value: "" },
    { label: "ConfirmPassword", lower: "confirmpassword", placeholder: "****************", Required: true, type: "password", pattern:"", value: "" },
  ]);
  const [secondconfigurationPage] = useState([
    { label: "FirstName", lower: "firstname", placeholder: "First Name", Required: true, type: "text" , pattern:"", value: "" },
    { label: "FamilyName", lower: "familyname", placeholder: "Family Name", Required: true, type: "text", pattern:"", value: "" },
    { label: "Date", lower: "date", placeholder: "Date", Required: false, type: "date" , pattern:"", value: "" },
    { label: "Phone", lower: "phone", placeholder: "Phone", Required: false, type: "tel", pattern:"[0-9]{3}-[0-9]{2}-[0-9]{3}", value: "" },
    { label: "Photopath", lower: "Photopath", placeholder: "Photopath", Required: false, pattern:"", value: "" },
    { label: "GroupCode", lower: "groupcode", placeholder: "Group Code", type: "Text" , Required: false, pattern:"", value: "" },
  ]);

  function verifyEmail(){
  if (formData.email == null || !String(formData.email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )){
      setErrorEmail("Mail invalid: 'example@example.com'");
      return false;
    }
    return true;
  };

  function verifyPasswordCheck(){
    if (formData.password == null || formData.confirmpassword == null || formData.password != formData.confirmpassword) {
      setErrorPasswordMatch("As senhas não coincidem");
      return false;
    }
    return true;
  };

  function validPassword() {
    //rethinking
    const minLengthPassword = 16;
    const errorFigure = " ❌";
    const writeFigure = " ✅";

    // Mensagens base
    const lengthProblem = "Password must be at least 16 characters " + errorFigure;
    const lowerCaseProblem = "Password must have 1 lowercase character " + errorFigure;
    const upperCaseProblem = "Password must have 1 uppercase character " + errorFigure;
    const digitProblem = "Password must have 1 digit " + errorFigure;
    const specialCharProblem = "Password must have at least 1 special character " + errorFigure;

    // Regex checks
    const hasLowerCase = /[a-z]/;
    const hasUpperCase = /[A-Z]/;
    const hasDigit = /\d/;
    const hasSpecialChar = /[\W_]/;

    // Validação com ternários
    const password = formData.password || ""; // ou formData.password, dependendo do campo correto

    const lengthMessage =
      password.length >= minLengthPassword
        ? lengthProblem.replace(errorFigure, writeFigure) 
        : lengthProblem;

    const lowerCaseMessage =
      hasLowerCase.test(password)
        ? lowerCaseProblem.replace(errorFigure, writeFigure)
        : lowerCaseProblem;

    const upperCaseMessage =
      hasUpperCase.test(password)
        ? upperCaseProblem.replace(errorFigure, writeFigure)
        : upperCaseProblem;

    const digitMessage =
      hasDigit.test(password)
        ? digitProblem.replace(errorFigure, writeFigure)
        : digitProblem;

    const specialCharMessage =
      hasSpecialChar.test(password)
        ? specialCharProblem.replace(errorFigure, writeFigure)
        : specialCharProblem;
      const messageSend = [lengthMessage, lowerCaseMessage, upperCaseMessage, digitMessage, specialCharMessage]


      if (messageSend.some(str => str.includes("❌")))
      {
        setErrorPasswordCheck(messageSend);
        return false
      }
      setErrorPasswordCheck(null);
      return true

    }

const verifyEmailBd = async () => {
  try {
    setErrorEmail(null);
    console.log("aqui");
    const res = await apiCall.get("/auth/AlreadyInDb", {params: { email: formData.email }
});
    // Exemplo: lidar com o resultado
    if (res.data) {
      setErrorEmail("Email já existe na base de dados.");
    } else {
      setErrorEmail(null);
    }
    return (!res.data);
  } catch (err) {
    console.error("Erro ao verificar email:", err);
    setErrorEmail(err.message || "Erro ao verificar o email.");
    return false;
  }
};


const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  const handleNext = () => {
    if (! verifyEmail() ) return
    if (! verifyEmailBd()) return
    if (! validPassword() ) return
    if (! verifyPasswordCheck() ) return
    setErrorEmail(null);
    setErrorPasswordCheck(null);
    setErrorPasswordMatch(null);
    setStep(2);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorEmail(null);
    setErrorPasswordCheck(null);
    setErrorPasswordMatch(null);
    const allFields = [...firstConfigurationPage, ...secondconfigurationPage];
    const payload = allFields.reduce((acc, field) => {
      acc[field.lower] = formData[field.lower] ?? ""; // pega os dados reais do formulário
      return acc;
    }, {});
    const path = '/auth/signin';
    try {
      const res = await apiCall.post(path, payload);

    navigate('/login');
    setUser(res.data);
    } catch (err) {
      setErrorSubmit(err.message || 'Login failed');
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
          value={formData[field.lower] ?? ""}
          onChange={handleChange}
          className="w-full p-3 border border-inputBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-inputFocus text-text"
          required={field.Required}
          pattern={field.pattern || undefined}
        />
        {field.label == "Email" && errorEmail &&  <p className="text-red-500 mt-2">{errorEmail}</p>   }
        {field.label == "Password" && errorPasswordCheck  && !errorPasswordMatch && errorPasswordCheck.map((error) =>(
          <p className="text-red-500 mt-2">{error}</p>
        ))
        }
        {field.label == "ConfirmPassword" && errorPasswordMatch && <p className="text-red-500 mt-2">Erro: {errorPasswordMatch}</p>}

      </div>
    ));


  return (
    <div className="max-w mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Sign In</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {step ===1 && (
            <>
             {renderFields(firstConfigurationPage)}
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
        <h2>Está quase feito! Só falta mais um step</h2>

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
          {errorSubmit &&  <p className="text-red-500 mt-2">{errorSubmit}</p>   }
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