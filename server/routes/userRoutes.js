const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/createUser', userController.createUser);
router.post('/login', userController.login);
router.get('/perfil/:id', userController.getProfile);
router.post('/perfil/:id', userController.updateProfile);
router.get('/usuarios', userController.getUsers);
router.delete('/usuario/:id', userController.deleteUser);
router.put('/usuario/:id/rol', userController.changeUserRole);
router.put('/usuario/:id/ban', userController.banUser);

router.get('/notificaciones/:idUsuario', userController.getNotifications);
router.post('/notificacion-leida/:id', userController.markNotificationRead);

module.exports = router;
