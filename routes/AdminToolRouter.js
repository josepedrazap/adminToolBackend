const express = require("express");

const router = express.Router();

const authAdmin = require("../middlewares/authAdmin");
const removalsController = require("../controllers/adminApp/removals");
const reportsController = require("../controllers/adminApp/reports");
const transportersController = require("../controllers/adminApp/transporters");
const localsController = require("../controllers/adminApp/locals");
const usersController = require("../controllers/users");
const customerController = require("../controllers/adminApp/customers");
const toolsController = require("../controllers/tools");

// removals
router.get("/removals", authAdmin, removalsController.retriveRemovals);
router.patch("/removals", authAdmin, removalsController.createRemoval);
router.get(
  "/removals/getDataCreateRemoval",
  authAdmin,
  removalsController.getDataCreateRemoval
);
router.delete("/removals", authAdmin, removalsController.deleteRemoval);
router.get("/removals/stats", authAdmin, removalsController.statsRemovals);
router.get("/tempremoval", removalsController.tempremovals);
// reports
router.get("/reports", authAdmin, reportsController.retriveReports);
router.post("/reports", authAdmin, reportsController.createReport);
router.get(
  "/reports/getDataCreateReports",
  authAdmin,
  reportsController.getDataCreateReports
);
router.get(
  "/reports/loadDataCreateReport",
  authAdmin,
  reportsController.loadDataCreateReport
);

// transporters
router.post("/transporters", transportersController.create);
router.get("/transporters", transportersController.getTransporters);
router.delete("/transporters", transportersController.delete);
router.patch("/transporters", transportersController.update);

// locals
router.post("/locals", localsController.create);
router.patch("/locals", localsController.update);
router.get("/locals", localsController.retrieve);
router.get("/locals/getDataCreateLocal", localsController.getDataCreateLocal);
router.delete("/locals", localsController.delete);
// users
router.post("/users", usersController.createUser);
router.get("/users", usersController.getUsers);
router.patch("/users", usersController.patchUser);
router.delete("/users", usersController.deleteUser);

//customers
router.post("/customers", customerController.create);
router.get("/customers", customerController.retrieve);
router.patch("/customers", customerController.update);
router.delete("/customers", customerController.delete);

//tools
// router.get("/tools", toolsController.aggregateCusmerIDToLocal);
router.get("/tools", toolsController.aggregateStatusToTransporters);

module.exports = router;
