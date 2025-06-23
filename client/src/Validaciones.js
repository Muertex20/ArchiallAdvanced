export const validarRegistro = (Contrasena, Contrasena2, Correo) => {
  const errores = [];

  if (!Correo || Correo.trim() === '') {
    errores.push('El campo "Correo" es obligatorio.');
  }

  if (!Contrasena || Contrasena.trim() === '') {
    errores.push('El campo "Contraseña" es obligatorio.');
  }

  if (!Contrasena2 || Contrasena2.trim() === '') {
    errores.push('El campo "repetir Contraseña" es obligatorio.');
  }

  if (Contrasena || Contrasena.trim() === '' || Contrasena2 || Contrasena2.trim() === '' ) {
    console.log("1");
    if (Contrasena !== Contrasena2){
      errores.push('Las contraseñas deben ser iguales.');
    }
  }
  return errores;
};