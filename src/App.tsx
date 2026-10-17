// @ts-ignore
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './componentes/Login';
import Inicio from './componentes/Inicio';
import GestionUsuarios from './componentes/GestionUsuarios';
import Horarios from './componentes/Horarios';
import Cursos from './componentes/Cursos'; // 👈 Importamos el nuevo componente de Asignaturas

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/inicio" element={<Inicio />} />
                <Route path="/usuarios" element={<GestionUsuarios />} />
                <Route path="/horarios" element={<Horarios />} />
                <Route path="/cursos" element={<Cursos />} /> {/* 👈 Agregamos la ruta de Asignaturas */}
            </Routes>
        </BrowserRouter>
    );
}

export default App;