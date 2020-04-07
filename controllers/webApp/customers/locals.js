const Customers = require("../../../models/customers");
const Locals = require("../../../models/locals");
const Removals = require("../../../models/removals");
const ecoData = require("../../../files/ecoData.json");

exports.getLocals = async (req, res) => {
  const locals = await Locals.find({
    customerID: req.entityID,
    status: "READY"
  }).populate("suscriptionID");
  return res.status(200).send(locals);
};
