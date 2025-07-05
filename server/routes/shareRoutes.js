const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

router.post('/compartir-archivos', shareController.shareFiles);
router.get('/archivos-compartidos-pendientes/:idUsuario', shareController.getPendingSharedFiles);
router.post('/aceptar-archivos-compartidos', shareController.acceptSharedFiles);
router.post('/rechazar-archivos-compartidos', shareController.rejectSharedFiles);

module.exports = router;
