const Transporters = require("../../models/transporters");

exports.create = (req, res) => {
  Transporters.create(req.body, (err, transporter) => {
    if (err) {
      console.log(err);
    }
    return res.status(200).send(transporter);
  });
};

exports.getTransporters = (req, res) => {
  Transporters.find({ status: "READY" }).exec((err, transporters) => {
    if (err) {
      console.log(err);
    }
    return res.status(200).send(transporters);
  });
};
exports.update = (req, res) => {
  console.log(req.body);
  Transporters.findOneAndUpdate({ _id: req.body._id }, req.body).exec(
    (_err, transporter) => {
      return res.status(200).send(transporter);
    }
  );
};
exports.delete = (req, res) => {
  Transporters.findOneAndUpdate(
    { _id: req.query.transporterID },
    { status: "DELETED" }
  ).exec((_err, transporter) => {
    return res.status(200).send(transporter);
  });
};
