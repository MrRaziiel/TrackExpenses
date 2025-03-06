import React from "react";
import { Route, Routes } from "react-router-dom";
import './App.css';
import Header from './components/Header/Header';
import Home from './components/Pages/Home';
import Expenses from './components/Pages/Expenses';
import { ThemeProvider } from "styled-components";
import { theme } from "./components/Theme/Theme";
import GlobalStyle from "./components/Theme/GlobalStyle";
import Login from "./components/Pages/Login";
import SignIn from "./components/Pages/SignIn";
import Footer from "./components/Footer/Footer";
import Sidebar from "./components/Menu/Sidebar";
import { AuthProvider } from "./components/Authentication/AuthContext";
import Dashboard from "./components/Pages/Administrador/Dashboard";

function App() {
    return (
        <AuthProvider>
            <ThemeProvider theme={theme}>
                <GlobalStyle />
                <div className="flex flex-col min-h-screen">
                    <Header />
                    <div>
                        <main className="flex-grow grid grid-cols-13">
                            {/* Sidebar mais pequena */}
                            <div className="col-span-2">
                                <Sidebar />
                            </div>

                            {/* Conteúdo principal maior */}
                            <div className="col-span-11 ms-8">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/Home" element={<Home />} />
                                <Route path="/Expenses" element={<Dashboard />} />
                                <Route path="/Login" element={<Login />} />
                                <Route path="/SignIn" element={<SignIn />} />
                            </Routes>
                            </div>
                        </main>
                    </div>
                </div>
                <Footer />
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;


