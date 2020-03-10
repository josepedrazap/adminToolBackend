const express = require('express')

const router = express.Router()

const authController = require('../controllers/authController.js')
const auth = require('../middlewares/auth.js')

router.post('/login', authController.login)
router.post('/logout', auth, authController.logout)
router.post('/token_check', auth, authController.tokenCheck)

module.exports = router
