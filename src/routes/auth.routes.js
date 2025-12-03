const express = require('express');
const { register, login, googleLogin, getGoogleClientId } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/google/client-id', getGoogleClientId);

module.exports = router;


