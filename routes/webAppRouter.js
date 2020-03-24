const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth");
const removalsControllerLocal = require("../controllers/webApp/locals/removals");
const dashboardControllerLocal = require("../controllers/webApp/locals/dashboard");

// removals
router.get("/removals", auth, removalsControllerLocal.getRemovals);

// dashboard
router.get("/dashboard", auth, dashboardControllerLocal.index);

module.exports = router;
