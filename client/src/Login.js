import React, { useState } from 'react';
import Axios from "axios";
import { useNavigate } from 'react-router-dom';
import './style/Login.css';

function Login() {
  const [Correo, setCorreo] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const Navigate = useNavigate();

  const iniciarSesion = () => {
    if (!Correo || !Contrasena) {
      alert("Debe completar todos los campos.");
      return;
    }

    Axios.post('http://localhost:3001/Login', {
      Correo,
      Contrasena
    })
      .then((res) => {
        console.log("Respuesta del backend:", res);
        if (res.data.status === 'success') {
          alert("Inicio de sesión exitoso.");
          Navigate('/Menu');
          // Redirigir o guardar info según necesidad
        } else {
          alert("Credenciales inválidas.");
        }
      })
      .catch((error) => {
        console.error("Error al iniciar sesión:", error);
        alert("Error al iniciar sesión.");
      });
  };

  return (
    <div className="login-container">
      <h1>Inicio de sesion</h1>

      <div className="input-group">
        <label htmlFor="Correo">Correo:</label>
        <input
          type="text"
          id="correo"
          value={Correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label htmlFor="Contrasena">Contraseña:</label>
        <input
          type="password"
          id="Contrasena"
          value={Contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
      </div>

      <button type="button" onClick={iniciarSesion}>INICIAR SESION</button>
      <p>¿Quieres registrarte? <a href='/Register'>Haz click aqui</a></p>
    </div>

  );
}

export default Login
