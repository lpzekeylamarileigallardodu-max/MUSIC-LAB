// @ts-ignore
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './componentes/Login';
import Inicio from './componentes/Inicio';
import GestionUsuarios from './componentes/GestionUsuarios';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/inicio" element={<Inicio />} />
                <Route path="/usuarios" element={<GestionUsuarios />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;