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
const auctionController = require("../controllers/adminApp/auction");

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
router.get("/removals/tempremoval", removalsController.tempremovals);
router.get("/removals/index", removalsController.index);

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
router.post("/locals", authAdmin, localsController.create);
router.patch("/locals", authAdmin, localsController.update);
router.get("/locals", authAdmin, localsController.retrieve);
router.get(
  "/locals/getDataCreateLocal",
  authAdmin,
  localsController.getDataCreateLocal
);
router.delete("/locals", authAdmin, localsController.delete);
// users
router.post("/users", authAdmin, usersController.createUser);
router.get("/users", authAdmin, usersController.getUsers);
router.patch("/users", authAdmin, usersController.patchUser);
router.delete("/users", authAdmin, usersController.deleteUser);

// auction
router.post("/auction/createRequest", auctionController.craeteRequest);
router.get("/auction/confirm", auctionController.confirm);

//customers
router.post("/customers", authAdmin, customerController.create);
router.get("/customers", authAdmin, customerController.retrieve);
router.patch("/customers", authAdmin, customerController.update);
router.delete("/customers", authAdmin, customerController.delete);
router.get("/customers/stats", authAdmin, customerController.stats);
//tools
// router.get("/tools", toolsController.aggregateCusmerIDToLocal);
router.get("/tools", toolsController.aggregateStatusToTransporters);

module.exports = router;
