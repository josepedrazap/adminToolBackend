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
const reportsControllerCustomer = require("../controllers/webApp/customers/reports");
const removalsControllerCustomer = require("../controllers/webApp/customers/removals");

// Removals
router.post("/removals", auth, removalsControllerLocal.createRemoval);

router.get("/removals", auth, (req, res) => {
  if (req.userType === "LOCAL") {
    removalsControllerLocal.getRemovals(req, res);
  } else {
    removalsControllerCustomer.getRemovals(req, res);
  }
});

router.get("/removals/prev", auth, (req, res) => {
  if (req.userType === "LOCAL") {
    removalsControllerLocal.getPrevRemovals(req, res);
  } else {
    removalsControllerCustomer.getPrevRemovals(req, res);
  }
});

router.get("/removals/historic", auth, (req, res) => {
  if (req.userType === "LOCAL") {
    removalsControllerLocal.getHistoricRemovals(req, res);
  } else {
    removalsControllerCustomer.getHistoricRemovals(req, res);
  }
});

// Dashboard
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
router.get("/reports", auth, (req, res) => {
  if (req.userType === "LOCAL") {
    reportsControllerLocal.retriveReports(req, res);
  } else {
    reportsControllerCustomer.retriveReports(req, res);
  }
});

// Locals
router.get("/locals", auth, localsControllerCustomer.getLocals);

module.exports = router;
