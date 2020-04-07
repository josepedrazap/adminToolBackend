const Locals = require("../../../models/locals");
const Reports = require("../../../models/reports");

exports.retriveReports = (req, res) => {
  Reports.find({ localID: req.entityID })
    .populate("localID")
    .exec((err, reports) => {
      if (err) {
        return res.status(400).send();
      }
      Locals.populate(
        reports,
        {
          path: "localID.customerID",
          model: "Customer"
        },
        (_err, reports) => {
          return res.status(200).send(reports);
        }
      );
    });
};
