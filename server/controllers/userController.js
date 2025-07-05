const db = require('../utils/db');
const bcrypt = require('bcrypt');

exports.createUser = async (req, res) => {
  const { Nombre, Correo, Contrasena } = req.body;
  try {
    const hash = await bcrypt.hash(Contrasena, 10);
    const query = 'INSERT INTO usuario (Nombre, Correo, Contraseña, Rol) VALUES (?, ?, ?, ?)';
    db.query(query, [Nombre, Correo, hash, 'usuario'], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al registrar nombre' });
      const idUsuario = result.insertId;
      const repoQuery = 'INSERT INTO repositorio (Nombre, Fecha_Creacion, ID_Usuario) VALUES (?, NOW(), ?)';
      db.query(repoQuery, [`Repositorio de ${Nombre}`, idUsuario], (err2) => {
        if (err2) return res.status(500).json({ error: 'Usuario creado pero error al crear repositorio' });
        res.status(201).json({ message: 'Usuario y repositorio creados exitosamente' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al hashear contraseña' });
  }
};

exports.login = (req, res) => {
  const { Correo, Contrasena } = req.body;
  const query = 'SELECT * FROM usuario WHERE Correo = ?';
  db.query(query, [Correo], async (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Error en el servidor' });
    if (results.length > 0) {
      const user = results[0];
      const match = await bcrypt.compare(Contrasena, user.Contraseña);
      if (match) {
        return res.status(200).json({ status: 'success', user });
      } else {
        return res.status(401).json({ status: 'fail', message: 'Credenciales inválidas' });
      }
    } else {
      return res.status(401).json({ status: 'fail', message: 'Credenciales inválidas' });
    }
  });
};

exports.getProfile = (req, res) => {
  const id = req.params.id;
  db.query('SELECT FotoPerfil, Descripcion, Baneado, Nombre FROM usuario WHERE ID_Usuario = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener perfil' });
    res.json(results[0]);
  });
};

exports.updateProfile = (req, res) => {
  const id = req.params.id;
  const { FotoPerfil, Descripcion, Nombre } = req.body;
  let fields = [];
  let values = [];
  if (FotoPerfil !== undefined) {
    fields.push('FotoPerfil = ?');
    values.push(FotoPerfil);
  }
  if (Descripcion !== undefined) {
    fields.push('Descripcion = ?');
    values.push(Descripcion);
  }
  if (Nombre !== undefined && Nombre !== "") {
    fields.push('Nombre = ?');
    values.push(Nombre);
  }
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }
  values.push(id);
  const query = `UPDATE usuario SET ${fields.join(', ')} WHERE ID_Usuario = ?`;
  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar perfil' });
    res.json({ status: 'success' });
  });
};

exports.getUsers = (req, res) => {
  db.query('SELECT ID_Usuario, Nombre, Correo, Rol, Baneado, FotoPerfil, Descripcion FROM usuario', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener usuarios' });
    res.status(200).json(results);
  });
};

exports.deleteUser = (req, res) => {
  const idUsuario = req.params.id;
  db.query('DELETE FROM archivo WHERE ID_Usuario = ?', [idUsuario], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar archivos del usuario' });
    db.query('DELETE FROM repositorio WHERE ID_Usuario = ?', [idUsuario], (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al eliminar repositorio del usuario' });
      db.query('DELETE FROM usuario WHERE ID_Usuario = ?', [idUsuario], (err3) => {
        if (err3) return res.status(500).json({ error: 'Error al eliminar usuario' });
        res.json({ status: 'success', message: 'Usuario y datos relacionados eliminados' });
      });
    });
  });
};

exports.changeUserRole = (req, res) => {
  const idUsuario = req.params.id;
  const { rol } = req.body;
  db.query('UPDATE usuario SET Rol = ? WHERE ID_Usuario = ?', [rol, idUsuario], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al cambiar rol' });
    res.json({ status: 'success', message: 'Rol actualizado' });
  });
};

exports.banUser = (req, res) => {
  const idUsuario = req.params.id;
  const { baneado } = req.body;
  db.query('UPDATE usuario SET Baneado = ? WHERE ID_Usuario = ?', [baneado ? 1 : 0, idUsuario], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al banear usuario' });
    res.json({ status: 'success', message: 'Usuario baneado' });
  });
};

exports.getNotifications = (req, res) => {
  const idUsuario = req.params.idUsuario;
  db.query('SELECT * FROM notificacion WHERE ID_Usuario = ? AND Leida = 0', [idUsuario], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener notificaciones' });
    res.json(results);
  });
};

exports.markNotificationRead = (req, res) => {
  db.query('UPDATE notificacion SET Leida = 1 WHERE ID_Notificacion = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al marcar como leída' });
    res.json({ status: 'ok' });
  });
};
