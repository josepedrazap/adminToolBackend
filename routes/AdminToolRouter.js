const express = require('express')

const router = express.Router()

const authAdmin = require('../middlewares/authAdmin')
const removalsController = require('../controllers/removals')
const reportsController = require('../controllers/reports')
const transportersController = require('../controllers/transporters')
const localsController = require('../controllers/locals')
const usersController = require('../controllers/users')
const customerController = require('../controllers/customers')
const toolsController = require('../controllers/tools')

// removals
router.get('/removals', authAdmin, removalsController.retriveRemovals)
router.patch('/removals', authAdmin, removalsController.createRemoval)
router.get('/removals/getDataCreateRemoval', authAdmin, removalsController.getDataCreateRemoval)
router.delete('/removals', authAdmin, removalsController.deleteRemoval)
router.get('/removals/stats', authAdmin, removalsController.statsRemovals)
// reports
router.get('/reports', authAdmin, reportsController.retriveReports)
router.post('/reports', authAdmin, reportsController.createReport)
router.get('/reports/getDataCreateReports', authAdmin, reportsController.getDataCreateReports)
router.get('/reports/loadDataCreateReport', authAdmin, reportsController.loadDataCreateReport)

// transporters
router.post('/transporters', transportersController.create)
router.get('/transporters', transportersController.getTransporters)

// locals
router.post('/locals', localsController.create)

// users
router.post('/users', usersController.createUser)
router.get('/users', usersController.getUsers)
router.patch('/users', usersController.patchUser)
router.delete('/users', usersController.deleteUser)

//customers
router.post('/customers', customerController.create)
router.get('/customers', customerController.retrieve)

//tools
router.get('/tools', toolsController.aggregateCusmerIDToLocal)

module.exports = router
