const Removals = require("../models/removals");
const Locals = require("../models/locals");
const Transporters = require("../models/transporters");
const pdfUpload = require("../services/pdfUpload");
const Customers = require("../models/customers");

exports.createRemoval = async (req, res) => {
  let status = "PENDING_TRANS";
  var removal = null;
  const author = "APPWEB";

  if (req.body.transporterID) {
    if (String(req.body.payment) === "0") {
      status = "PENDING_PAYMENT";
    } else {
      status = "COMPLETE";
    }
  }

  if (req.body._id) {
    removal = await Removals.findOneAndUpdate(
      { _id: req.body._id },
      {
        ...req.body,
        status,
        author,
        lastModificationID: req.userID,
        datetimeLastModification: Date.now()
      }
    );

    if (req.body.file) {
      pdfUpload
        .index({
          pdf: req.body.file,
          name: removal._id
        })
        .then(async response => {
          await Removals.findOneAndUpdate(
            { _id: removal._id },
            { urlReport: response }
          );
          return res.status(200).send(removal);
        })
        .catch(err => {
          return res.status(412).send(err);
        });
    } else {
      return res.status(200).send(removal);
    }
  } else {
    delete req.body._id;
    removal = await Removals.create({ ...req.body, status });
    if (req.body.file) {
      pdfUpload
        .index({
          pdf: req.body.file,
          name: removal._id
        })
        .then(async response => {
          await Removals.findOneAndUpdate(
            { _id: removal._id },
            { urlReport: response }
          );
          return res.status(200).send(removal);
        })
        .catch(err => {
          return res.status(400).send(err);
        });
    } else {
      return res.status(200).send(removal);
    }
  }
};
