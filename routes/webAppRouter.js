const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth");

const removalsController = require("../controllers/webApp/removals");
const profileController = require("../controllers/webApp/profile");
const dashboardControllerLocal = require("../controllers/webApp/locals/dashboard");
const adminControllerLocal = require("../controllers/webApp/locals/admin");
const reportsControllerLocal = require("../controllers/webApp/locals/reports");

const adminControllerCustomer = require("../controllers/webApp/customers/admin");
const dashboardControllerCustomer = require("../controllers/webApp/customers/dashboard");
const localsControllerCustomer = require("../controllers/webApp/customers/locals");
const reportsControllerCustomer = require("../controllers/webApp/customers/reports");

// Removals
router.post("/removals", auth, removalsController.createRemoval);
router.get("/removals", auth, removalsController.getRemovals);
router.get("/removals/previus", auth, removalsController.getPreviusRemovals);
router.get("/removals/historic", auth, removalsController.getHistoricRemovals);
router.post("/removals/setRating", auth, removalsController.setRemovalRating);

// Profile
router.post("/profile/changePassword", auth, profileController.changePassword);
router.patch("/profile", auth, profileController.updateData);
router.get("/profile", auth, profileController.getData);

// Dashboard
router.get("/dashboard", auth, (req, res) => {
  if (req.userType === "LOCAL") {
    dashboardControllerLocal.index(req, res);
  } else {
    dashboardControllerCustomer.index(req, res);
  }
});

//Admin
router.get("/admin", auth, (req, res) => {
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
