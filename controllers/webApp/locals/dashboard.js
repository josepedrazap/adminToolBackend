const Removals = require("../../../models/removals");
const ecoData = require("../../../files/ecoData.json");

exports.index = async (req, res) => {
  if (!req.query.dateInit || !req.query.dateFinish) {
    return res.status(406).send();
  }
  var dateInit = new Date(req.query.dateInit.replace(/['"]+/g, ""));
  var dateFinish = new Date(req.query.dateFinish.replace(/['"]+/g, ""));

  const removals = await Removals.find({
    status: "COMPLETE",
    localID: req.entityID,
    datetimeRemoval: { $lt: dateFinish, $gt: dateInit }
  })
    .populate("localID")
    .populate("transporterID");

  const totalMaterials = await Removals.aggregate([
    {
      $match: {
        status: "COMPLETE",
        localID: req.entityID,
        datetimeRemoval: { $lt: dateFinish, $gt: dateInit }
      }
    },
    { $project: { _id: 0, materials: 1 } },
    { $unwind: "$materials" },
    {
      $group: {
        _id: "$materials.material",
        quantity: { $sum: "$materials.quantity" }
      }
    },
    { $sort: { quantity: -1 } }
  ]);

  var ecoeq = [
    { ID: "TREE", q: 0, unity: "Un" },
    { ID: "WATER", q: 0, unity: "L" },
    { ID: "PETROL", q: 0, unity: "L" },
    { ID: "ENERGY", q: 0, unity: "kWatt" },
    { ID: "CO2", q: 0, unity: "Kg" }
  ];

  totalMaterials.map(element => {
    let temp = ecoData.filter(
      material => material.materialID === element._id
    )[0];
    temp.savesPerKilogram.forEach(el => {
      for (let i = 0; i < ecoeq.length; i++) {
        if (ecoeq[i].ID === el.ID) {
          ecoeq[i].q += el.quantity * element.quantity;
        }
      }
    });
  });

  return res.status(200).send({ totalMaterials, ecoeq, removals });
};
