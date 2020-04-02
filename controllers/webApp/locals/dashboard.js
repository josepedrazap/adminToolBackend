const Removals = require("../../../models/removals");
const ecoData = require("../../../files/ecoData.json");
const Locals = require("../../../models/locals");
exports.index = async (req, res) => {
  if (!req.query.dateInit || !req.query.dateFinish) {
    return res.status(406).send();
  }
  var dateInit = new Date(req.query.dateInit.replace(/['"]+/g, ""));
  var dateFinish = new Date(req.query.dateFinish.replace(/['"]+/g, ""));

  let monthTemp = dateInit.getMonth();
  let yearTemp = dateInit.getFullYear();

  monthTemp = monthTemp - 1;
  if (monthTemp < 0) {
    yearTemp = yearTemp - 1;
    monthTemp = 11;
  }

  const datetimeInitPrev = new Date(yearTemp, monthTemp, 1);
  const datetimeFinishPrev = new Date(yearTemp, monthTemp + 1, 0, 23, 59, 59);

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
        datetimeRemoval: { $lt: dateFinish, $gte: dateInit }
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

  const totalMaterialsPrev = await Removals.aggregate([
    {
      $match: {
        status: "COMPLETE",
        localID: req.entityID,
        datetimeRemoval: { $lt: datetimeFinishPrev, $gte: datetimeInitPrev }
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

  const local = await Locals.findOne({ _id: req.entityID });
  return res
    .status(200)
    .send({ totalMaterials, ecoeq, removals, totalMaterialsPrev, local });
};
