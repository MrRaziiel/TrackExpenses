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

function App() {
    return (
        <ThemeProvider theme={theme}>
      <GlobalStyle />
        <div className='App'>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Home" element={<Home />} />
                <Route path="/Expenses" element={<Expenses />} />
                <Route path="/Login" element={<Login />} />
                <Route path="/SignIn" element={<SignIn />} />
            </Routes>
        </div>
        </ThemeProvider>
    );
}

export default App;
