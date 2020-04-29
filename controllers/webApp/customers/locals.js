const Locals = require("../../../models/locals");

exports.getLocals = async (req, res) => {
  const locals = await Locals.find({
    customerID: req.entityID,
    status: "READY",
  }).populate("suscriptionID");
  return res.status(200).send(locals);
};
