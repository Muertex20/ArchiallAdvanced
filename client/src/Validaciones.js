export const validarRegistro = (Contrasena, Contrasena2, Correo) => {
  const errores = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!Correo || !emailRegex.test(Correo)) {
    errores.push('El correo debe tener un formato válido (ejemplo: usuario@dominio.com)');
  }

  if (!Contrasena || Contrasena.trim() === '') {
    errores.push('El campo "Contraseña" es obligatorio.');
  }

  if (!Contrasena2 || Contrasena2.trim() === '') {
    errores.push('El campo "repetir Contraseña" es obligatorio.');
  }

  if (Contrasena || Contrasena.trim() === '' || Contrasena2 || Contrasena2.trim() === '') {
    console.log("1");
    if (Contrasena !== Contrasena2) {
      errores.push('Las contraseñas deben ser iguales.');
    }
  }
  return errores;
};