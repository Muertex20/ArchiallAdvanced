const db = require('../utils/db');

exports.shareFiles = (req, res) => {
  const { idUsuarioRemite, idUsuarioDestino, archivos } = req.body;
  const fecha = new Date();
  if (!idUsuarioRemite || !idUsuarioDestino || !archivos || archivos.length === 0) {
    return res.status(400).json({ error: 'Faltan datos para compartir archivos' });
  }
  const values = archivos.map(idArchivo => [idArchivo, idUsuarioDestino, idUsuarioRemite, fecha, 'pendiente']);
  db.query('INSERT INTO comparticion (ID_Archivo, ID_Usuario_Destino, ID_Usuario_Remite, Fecha_Comparticion, Estado) VALUES ?', [values], (err) => {
    if (err) return res.status(500).json({ error: 'Error al compartir archivos' });
    res.json({ status: 'success' });
  });
};

exports.getPendingSharedFiles = (req, res) => {
  const idUsuario = req.params.idUsuario;
  const query = `SELECT c.ID_Archivo, a.Nombre AS NombreArchivo, u.Nombre AS NombreRemitente FROM comparticion c JOIN archivo a ON c.ID_Archivo = a.ID_Archivo JOIN usuario u ON c.ID_Usuario_Remite = u.ID_Usuario WHERE c.ID_Usuario_Destino = ? AND c.Estado = 'pendiente'`;
  db.query(query, [idUsuario], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener archivos compartidos' });
    res.json(results);
  });
};

exports.acceptSharedFiles = (req, res) => {
  const { idUsuario, archivos } = req.body;
  if (!idUsuario || !archivos || archivos.length === 0) {
    return res.status(400).json({ error: 'Faltan datos para aceptar archivos' });
  }
  const placeholders = archivos.map(() => '?').join(',');
  const paramsUpdate = [idUsuario, ...archivos];
  const updateQuery = `UPDATE comparticion SET Estado = "aceptado" WHERE ID_Usuario_Destino = ? AND ID_Archivo IN (${placeholders})`;
  db.query(updateQuery, paramsUpdate, (err) => {
    if (err) return res.status(500).json({ error: 'Error al aceptar archivos' });
    db.query('SELECT ID_Repositorio FROM repositorio WHERE ID_Usuario = ? LIMIT 1', [idUsuario], (err, repoResults) => {
      if (err || repoResults.length === 0) return res.status(500).json({ error: 'No se encontró el repositorio del usuario destino' });
      const idRepositorioDestino = repoResults[0].ID_Repositorio;
      const selectQuery = `SELECT * FROM archivo WHERE ID_Archivo IN (${placeholders})`;
      db.query(selectQuery, archivos, (err, archivosResults) => {
        if (err) return res.status(500).json({ error: 'Error al obtener archivos originales' });
        const nuevosArchivos = archivosResults.map(archivo => [archivo.Nombre, archivo.Tipo, archivo.Tamaño, new Date(), archivo.Ruta, idUsuario, idRepositorioDestino]);
        db.query(`INSERT INTO archivo (Nombre, Tipo, Tamaño, Fecha_Subida, Ruta, ID_Usuario, ID_Repositorio) VALUES ?`, [nuevosArchivos], (err, insertResult) => {
          if (err) return res.status(500).json({ error: 'Error al copiar archivos al repositorio destino' });
          const nuevosIds = [];
          for (let i = 0; i < nuevosArchivos.length; i++) {
            nuevosIds.push(insertResult.insertId + i);
          }
          let updates = 0;
          for (let i = 0; i < archivos.length; i++) {
            db.query('UPDATE comparticion SET ID_Archivo = ? WHERE ID_Usuario_Destino = ? AND ID_Archivo = ? AND Estado = "aceptado"', [nuevosIds[i], idUsuario, archivos[i]], (err) => {
              updates++;
              if (updates === archivos.length) {
                db.query('SELECT ID_Usuario_Remite FROM comparticion WHERE ID_Usuario_Destino = ? AND ID_Archivo = ? LIMIT 1', [idUsuario, nuevosIds[0]], (err2, result) => {
                  if (!err2 && result.length > 0) {
                    const idRemitente = result[0].ID_Usuario_Remite;
                    db.query('INSERT INTO notificacion (ID_Usuario, Mensaje) VALUES (?, ?)', [idRemitente, `Tus archivos fueron aceptados por el usuario destino.`]);
                  }
                  res.json({ status: 'success' });
                });
              }
            });
          }
        });
      });
    });
  });
};

exports.rejectSharedFiles = (req, res) => {
  const { idUsuario, archivos } = req.body;
  if (!idUsuario || !archivos || archivos.length === 0) {
    return res.status(400).json({ error: 'Faltan datos para rechazar archivos' });
  }
  const placeholders = archivos.map(() => '?').join(',');
  const params = [idUsuario, ...archivos];
  const updateQuery = `UPDATE comparticion SET Estado = "rechazado" WHERE ID_Usuario_Destino = ? AND ID_Archivo IN (${placeholders})`;
  db.query(updateQuery, params, (err) => {
    if (err) return res.status(500).json({ error: 'Error al rechazar archivos' });
    db.query('SELECT ID_Usuario_Remite FROM comparticion WHERE ID_Usuario_Destino = ? AND ID_Archivo = ? LIMIT 1', [idUsuario, archivos[0]], (err2, result) => {
      if (!err2 && result.length > 0) {
        const idRemitente = result[0].ID_Usuario_Remite;
        db.query('INSERT INTO notificacion (ID_Usuario, Mensaje) VALUES (?, ?)', [idRemitente, `Tus archivos fueron rechazados por el usuario destino.`]);
      }
      res.json({ status: 'success' });
    });
  });
};
