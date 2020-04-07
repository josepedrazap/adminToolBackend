const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth");
const removalsControllerLocal = require("../controllers/webApp/locals/removals");
const dashboardControllerLocal = require("../controllers/webApp/locals/dashboard");
const adminControllerLocal = require("../controllers/webApp/locals/admin");
const reportsControllerLocal = require("../controllers/webApp/locals/reports");

const adminControllerCustomer = require("../controllers/webApp/customers/admin");
const dashboardControllerCustomer = require("../controllers/webApp/customers/dashboard");
const localsControllerCustomer = require("../controllers/webApp/customers/locals");
// removals
router.get("/removals", auth, removalsControllerLocal.getRemovals);
router.get("/removals/prev", auth, removalsControllerLocal.getPrevRemovals);
router.get(
  "/removals/historic",
  auth,
  removalsControllerLocal.getHistoricRemovals
);

// dashboard
router.get("/dashboard", auth, (req, res, next) => {
  if (req.userType === "LOCAL") {
    dashboardControllerLocal.index(req, res);
  } else {
    dashboardControllerCustomer.index(req, res);
  }
});

//Admin
router.get("/admin", auth, (req, res, next) => {
  if (req.userType === "LOCAL") {
    adminControllerLocal.getData(req, res);
  } else {
    adminControllerCustomer.getData(req, res);
  }
});

//Reports
router.get("/reports", auth, reportsControllerLocal.retriveReports);

// Locals
router.get("/locals", auth, localsControllerCustomer.getLocals);

module.exports = router;
