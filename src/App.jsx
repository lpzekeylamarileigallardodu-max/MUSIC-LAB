import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './componentes/Login';
import Inicio from './componentes/Inicio';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/inicio" element={<Inicio />} />
            </Routes>
        </BrowserRouter>
    );
}