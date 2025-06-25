import React, { useState } from 'react';
import { setCookie } from './Cookies';
import Axios from "axios";
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './style/Login.css';
import './style/SweetAlert.css';

function Login() {
  const [Correo, setCorreo] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const Navigate = useNavigate();

  const iniciarSesion = () => {
    if (!Correo || !Contrasena) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe completar todos los campos.',
        scrollbarPadding: false,
        confirmButtonColor: '#00e200',
        background: '#111',
        color: '#00ff00',
        customClass: {
          confirmButton: 'swal2-confirm-wide'
        }
      });
      return;
    }

    Axios.post('http://localhost:3001/Login', {
      Correo,
      Contrasena
    })
      .then((res) => {
        console.log("Respuesta del backend:", res);
        if (res.data.status === 'success') {
          setCookie('userId', res.data.user.ID_Usuario);
          Swal.fire({
            icon: "success",
            title: "¡Bienvenido!",
            text: "Redirigiendo al Menu...",
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            scrollbarPadding: false,
            background: '#111',
            color: '#00ff00',
            didOpen: () => Swal.showLoading()
          }).then(() => {
            Navigate('/Menu');
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Credenciales inválidas.',
            scrollbarPadding: false,
            confirmButtonColor: '#00e200',
            background: '#111',
            color: '#00ff00',
            customClass: {
              confirmButton: 'swal2-confirm-wide'
            }
          });
        }
      })
      .catch((error) => {
        console.error("Error al iniciar sesión:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al iniciar sesión.',
          scrollbarPadding: false,
          confirmButtonColor: '#00e200',
          background: '#111',
          color: '#00ff00',
          customClass: {
            confirmButton: 'swal2-confirm-wide'
          }
        });
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
