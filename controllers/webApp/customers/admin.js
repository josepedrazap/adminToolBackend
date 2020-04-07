const Customers = require("../../../models/customers");

exports.getData = async (req, res) => {
  const customer = await Customers.findOne({ _id: req.entityID }).populate(
    "localsID"
  );
  return res.status(200).send(customer);
};
