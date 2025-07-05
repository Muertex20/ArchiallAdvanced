const db = require('../utils/db');

exports.createRepo = (req, res) => {
  const { Nombre, ID_Usuario } = req.body;
  const query = 'INSERT INTO repositorio (Nombre, Fecha_Creacion, ID_Usuario) VALUES (?, NOW(), ?)';
  db.query(query, [Nombre, ID_Usuario], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al crear repositorio' });
    res.status(201).json({ message: 'Repositorio creado exitosamente', idRepositorio: result.insertId });
  });
};

exports.getUserRepo = (req, res) => {
  const idUsuario = req.params.idUsuario;
  db.query('SELECT ID_Repositorio FROM repositorio WHERE ID_Usuario = ? LIMIT 1', [idUsuario], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'No se encontró el repositorio' });
    res.json(results[0]);
  });
};
