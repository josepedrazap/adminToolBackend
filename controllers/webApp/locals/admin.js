const Locals = require("../../../models/locals");

exports.getData = async (req, res) => {
  const local = await Locals.findOne({ _id: req.entityID })
    .populate("customerID")
    .populate("suscriptionID");
  return res.status(200).send(local);
};
