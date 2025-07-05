const db = require('../utils/db');
const fs = require('fs');
const path = require('path');
const nsfwUtils = require('../utils/nsfw');
const clamavUtils = require('../utils/clamav');
const ffmpeg = require('fluent-ffmpeg');

exports.uploadFile = async (req, res) => {
  const { ID_Usuario, ID_Repositorio } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No se ha subido ningún archivo' });
  if (!ID_Usuario || !ID_Repositorio) return res.status(400).json({ error: 'Faltan datos de usuario o repositorio' });

  // Función para eliminar el archivo subido si existe
  const eliminarArchivo = () => {
    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignora si ya no existe */ }
  };

  try {
    // NSFW check
    if (req.file.mimetype.startsWith('image/')) {
      const nsfw = await nsfwUtils.isImageNSFW(req.file.path);
      if (nsfw) {
        eliminarArchivo();
        return res.status(400).json({ error: 'NO_PORNO', message: 'No puedes subir archivos +18 aquí.' });
      }
    }
    if (req.file.mimetype.startsWith('video/')) {
      let isNSFW = false;
      try {
        isNSFW = await nsfwUtils.isVideoNSFW(req.file.path);
      } catch (e) {
        eliminarArchivo();
        return res.status(500).json({ error: 'Error al analizar video', detalle: e && e.message ? e.message : e });
      }
      if (isNSFW) {
        eliminarArchivo();
        return res.status(400).json({ error: 'NO_PORNO', message: 'Los videos +18 están prohibidos' });
      }
    }

    // ClamAV scan
    let scanResult;
    try {
      scanResult = await clamavUtils.scanFile(req.file.path);
    } catch (e) {
      eliminarArchivo();
      return res.status(500).json({ error: 'Error al escanear archivo', detalle: e && e.message ? e.message : e });
    }
    if (scanResult.infected) {
      eliminarArchivo();
      return res.status(400).json({ error: 'Tu archivo contiene un virus y fue bloqueado por seguridad.', detalle: scanResult.raw });
    }

    // Save file info in DB
    const nombre = req.file.originalname;
    const tipo = req.file.mimetype;
    const tamaño = req.file.size;
    const fecha = new Date();
    const ruta = req.file.filename;
    const query = `INSERT INTO archivo (Nombre, Tipo, Tamaño, Fecha_Subida, Ruta, ID_Usuario, ID_Repositorio) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [nombre, tipo, tamaño, fecha, ruta, ID_Usuario, ID_Repositorio], (err, result) => {
      if (err) {
        eliminarArchivo();
        return res.status(500).json({ error: 'Error al guardar archivo en la base de datos' });
      }
      res.status(200).json({ message: 'Archivo subido exitosamente', filePath: req.file.path, archivoId: result.insertId });
    });
  } catch (error) {
    eliminarArchivo();
    res.status(500).json({ error: 'Error inesperado al subir archivo', detalle: error && error.message ? error.message : error });
  }
};

exports.getFiles = (req, res) => {
  const idRepositorio = req.params.idRepositorio;
  const idUsuario = req.query.user;
  if (!idUsuario) return res.status(400).json({ error: 'Falta el parámetro de usuario' });
  const query = 'SELECT * FROM archivo WHERE ID_Repositorio = ? AND ID_Usuario = ?';
  db.query(query, [idRepositorio, idUsuario], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener archivos' });
    res.status(200).json(results);
  });
};

exports.deleteFile = (req, res) => {
  const idArchivo = req.params.id;
  db.query('SELECT Ruta FROM archivo WHERE ID_Archivo = ?', [idArchivo], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Archivo no encontrado' });
    const rutaArchivo = results[0].Ruta;
    db.query('DELETE FROM archivo WHERE ID_Archivo = ?', [idArchivo], (err) => {
      if (err) return res.status(500).json({ error: 'Error al eliminar archivo' });
      db.query('SELECT COUNT(*) AS count FROM archivo WHERE Ruta = ?', [rutaArchivo], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al verificar archivos restantes' });
        if (results[0].count === 0) {
          const filePath = path.join(__dirname, '../uploads', rutaArchivo);
          fs.unlink(filePath, (err) => { });
        }
        res.status(200).json({ message: 'Archivo eliminado' });
      });
    });
  });
};

exports.downloadFile = (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', fileName);
  db.query('SELECT Nombre FROM archivo WHERE Ruta = ?', [fileName], (err, results) => {
    if (err || results.length === 0) return res.status(404).send('Archivo no encontrado');
    const nombreOriginal = results[0].Nombre;
    res.download(filePath, nombreOriginal, (err) => {
      if (err) res.status(500).send('Error al descargar el archivo');
    });
  });
};
