import React from "react";
import { Route, Routes } from "react-router-dom";
import './App.css';
import Header from './components/Header/Header';
import Home from './components/Pages/Home';
import Expenses from './components/Pages/Expenses';

function App() {
    return (
        <div className='App'>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Home" element={<Home />} />
                <Route path="/Expenses" element={<Expenses />} />
            </Routes>
        </div>
    );
}

export default App;
