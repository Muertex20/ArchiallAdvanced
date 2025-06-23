import React, { useState } from 'react';
import Axios from 'axios';
import './style/Register.css';
import { validarRegistro } from './Validaciones';

function Register() {
  const [Nombre, setNombre] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const [Contrasena2, setContrasena2] = useState("");
  const [Correo, setCorreo] = useState("");

  const addUser = () => {
    const errores = validarRegistro(Contrasena, Contrasena2, Correo); 
    if (errores.length > 0) {
      alert(errores.join('\n'));
      return;
    }
    Axios.post('http://localhost:3001/createUser', {
      Nombre: Nombre,
      Correo: Correo,
      Contrasena: Contrasena,
      Contrasena2: Contrasena2
    })
      .then((response) => {
        alert('Usuario registrado exitosamente');
      })
      .catch((error) => {
        if (error.response) {
          console.error('Error en la respuesta del servidor.');
        } else if (error.request) {
          console.error('No se recibió respuesta del servidor');
        } else {
          console.error('Error en la petición');
        }
      });
  };

  return (
    <div className="Container-register">
      <h1>Registro</h1>

      <div className="input-group">
        <label htmlFor="Nombre">Nombre:</label>
        <input
          type="text"
          id="Nombre"
          value={Nombre} 
          onChange={(e) => setNombre(e.target.value)}
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

      <div className="input-group">
        <label htmlFor="Contrasena2">Repetir contraseña:</label>
        <input
          type="password"
          id="Contrasena2"
          value={Contrasena2}
          onChange={(e) => setContrasena2(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label htmlFor="Correo">Correo:</label>
        <input
          type="text"
          id="correo"
          value={Correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
      </div>

      <button type="button" onClick={addUser}>REGISTRAR</button>
      <p>¿Quieres iniciar sesion? <a href='/login'>Haz click aqui</a></p>
    </div>

  );
}

export default Register;
