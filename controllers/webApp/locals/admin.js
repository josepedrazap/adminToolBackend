const Locasl = require("../../../models/locals");

exports.getDataLocal = async (req, res) => {
  const local = await Locasl.findOne({ _id: req.entityID })
    .populate("customerID")
    .populate("suscriptionID");
  return res.status(200).send(local);
};
