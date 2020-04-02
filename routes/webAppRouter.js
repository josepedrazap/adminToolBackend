const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth");
const removalsControllerLocal = require("../controllers/webApp/locals/removals");
const dashboardControllerLocal = require("../controllers/webApp/locals/dashboard");
const adminControllerLocal = require("../controllers/webApp/locals/admin");
// removals
router.get("/removals", auth, removalsControllerLocal.getRemovals);
router.get("/removals/prev", auth, removalsControllerLocal.getPrevRemovals);
router.get(
  "/removals/historic",
  auth,
  removalsControllerLocal.getHistoricRemovals
);

// dashboard
router.get("/dashboard", auth, dashboardControllerLocal.index);

//Admin
router.get("/admin", auth, adminControllerLocal.getDataLocal);

module.exports = router;
