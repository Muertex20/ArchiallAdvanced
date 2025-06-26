import React, { useState } from 'react';
import Axios from 'axios';
import './style/Register.css';
import Swal from 'sweetalert2';
import './style/SweetAlert.css';
import { validarRegistro } from './Validaciones';

function Register() {
  const [Nombre, setNombre] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const [Contrasena2, setContrasena2] = useState("");
  const [Correo, setCorreo] = useState("");

  const addUser = () => {
    const errores = validarRegistro(Contrasena, Contrasena2, Correo);
    if (errores.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Errores en el registro',
        html: errores.join('<br>'),
        confirmButtonColor: '#00e200',
        scrollbarPadding: false,
        background: '#111',
        color: '#00ff00',
        customClass: {
          confirmButton: 'swal2-confirm-wide'
        }
      });
      return;
    }
    Axios.post('http://localhost:3001/createUser', {
      Nombre: Nombre,
      Correo: Correo,
      Contrasena: Contrasena,
      Contrasena2: Contrasena2
    })
      .then((response) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Usuario registrado exitosamente.',
          background: '#111',
          color: '#00ff00',
          scrollbarPadding: false
        });
      })
      .catch((error) => {
        if (error.response) {
          Swal.fire({
            icon: 'error',
            title: 'Error en la respuesta del servidor.',
            confirmButtonColor: '#00e200',
            scrollbarPadding: false,
            background: '#111',
            color: '#00ff00',
            customClass: {
              confirmButton: 'swal2-confirm-wide'
            }
          });
        } else if (error.request) {
          Swal.fire({
            icon: 'error',
            title: 'No se recibió respuesta del servidor',
            confirmButtonColor: '#00e200',
            scrollbarPadding: false,
            background: '#111',
            color: '#00ff00',
            customClass: {
              confirmButton: 'swal2-confirm-wide'
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error en la petición',
            confirmButtonColor: '#00e200',
            scrollbarPadding: false,
            background: '#111',
            color: '#00ff00',
            customClass: {
              confirmButton: 'swal2-confirm-wide'
            }
          });
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
      <p className="login-link-row">
        ¿Quieres iniciar sesión?
        <a
          href="/login"
          className="login-link-btn"
          onClick={e => {
            e.preventDefault();
            Swal.fire({
              title: 'Redireccionando',
              text: 'Te llevaremos al login...',
              background: '#111',
              color: '#00ff00',
              showConfirmButton: false,
              timer: 1200,
              timerProgressBar: true,
              scrollbarPadding: false,
              customClass: {
                confirmButton: 'swal2-confirm-wide'
              }
            }).then(() => {
              window.location.href = '/login';
            });
          }}
          role="button"
          tabIndex={0}
        >
          Haz click aqui
        </a>
      </p>
    </div>

  );
}

export default Register;
