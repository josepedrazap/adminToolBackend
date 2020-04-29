const Users = require("../../models/user");
const Locals = require("../../models/locals");
const Customers = require("../../models/customers");
const PasswordGen = require("../../services/passwordGen");
const ImageUpload = require("../../services/imageUpload");
const DeleteObjectS3 = require("../../services/deleteObjectS3");
exports.changePassword = async (req, res) => {
  const user = await Users.findOne({ _id: req.userID });
  if (user && PasswordGen.compare(req.body.password, user.password)) {
    user.password = PasswordGen.hash(req.body.newPassword).hash;
    await user.save();
    return res.status(200).send();
  } else {
    return res.status(400).send();
  }
};

exports.updateData = async (req, res) => {
  var user = await Users.findOne({ _id: req.userID });

  if (user && PasswordGen.compare(req.body.password, user.password)) {
    user = await Users.findOneAndUpdate(
      { _id: req.userID },
      { ...req.body.user },
      { new: true }
    );
    if (req.userType === "LOCAL") {
      await Locals.findOneAndUpdate(
        { _id: req.entityID },
        { ...req.body.local }
      );
      return res.status(200).send();
    } else if (req.userType === "CUSTOMER") {
      var customer = await Customers.findOne({ _id: req.entityID });

      customer = await Customers.findOneAndUpdate(
        { _id: req.entityID },
        { ...req.body.customer }
      );

      if (customer.urlLogo !== req.body.customer.companyLogo) {
        console.log("CAMBIAR IMAGEN");
        var url = await ImageUpload.index({
          image: [req.body.customer.companyLogo],
          path: "logos",
          id: "logo_" + customer._id,
        });
        customer.urlLogo = url;
        customer.save();
        return res.status(200).send();
      } else {
        return res.status(200).send();
      }
    } else {
      return res.status(400).send();
    }
  } else {
    return res.status(403).send();
  }
};

exports.getData = async (req, res) => {
  const user = await Users.findById(req.userID);
  if (req.userType === "LOCAL") {
    const local = await Locals.findById(req.entityID)
      .populate("customerID")
      .populate("suscriptionID");
    return res.status(200).send({ user, data: local });
  } else {
    const customer = await Customers.findById(req.entityID);
    return res.status(200).send({ user, data: customer });
  }
};
