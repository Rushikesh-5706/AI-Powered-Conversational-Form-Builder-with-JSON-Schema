const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');

router.post('/generate', formController.generate);

module.exports = router;
