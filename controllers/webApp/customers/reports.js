const Locals = require("../../../models/locals");
const Reports = require("../../../models/reports");

exports.retriveReports = async (req, res) => {
  var query = {};
  if (req.query.localID === "ALL") {
    const locals = (await Locals.find({ customerID: req.entityID })).map(
      (local) => local._id
    );
    query = { localID: { $in: locals } };
  } else {
    query = {
      localID: req.query.localID,
    };
  }
  console.log(query);
  const reports = await Reports.find(query).populate("localID");
  return res.status(200).send(reports);
};
