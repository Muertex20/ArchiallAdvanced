const express = require('express');
const router = express.Router();
const repoController = require('../controllers/repoController');

router.post('/repositorio', repoController.createRepo);
router.get('/repositorio-usuario/:idUsuario', repoController.getUserRepo);

module.exports = router;
