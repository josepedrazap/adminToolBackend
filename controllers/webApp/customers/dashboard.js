const Customers = require("../../../models/customers");
const Locals = require("../../../models/locals");
const Removals = require("../../../models/removals");
const ecoData = require("../../../files/ecoData.json");
const removalsQ = require("../../../queries/removalsQueries");

exports.index = async (req, res) => {
  //SETUP DE FECHAS. CONSEGUIR LOS MESES
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

  //CONSEGUIR LOS LOCALES
  const locals = await Locals.find({ customerID: req.entityID });

  // CONSEGUIR LOS RETIROS DEL RANGO ACTUAL
  const removals = await Removals.find({
    ...removalsQ.removalQueries["COMPLETE"],
    localID: { $in: locals.map((local) => local._id) },
    datetimeRemoval: { $lt: dateFinish, $gt: dateInit },
  })
    .populate("localID")
    .populate("transporterID");

  // CONSEGUIR LOS MATERIALES DEL RANGO ANTERIOR
  const totalMaterialsPrevius = await Removals.aggregate([
    {
      $match: {
        ...removalsQ.removalQueries["COMPLETE"],
        localID: { $in: locals.map((local) => local._id) },
        datetimeRemoval: { $lt: datetimeFinishPrev, $gt: datetimeInitPrev },
      },
    },
    { $project: { _id: 0, materials: 1 } },
    { $unwind: "$materials" },
    {
      $group: {
        _id: "$materials.material",
        quantity: { $sum: "$materials.quantity" },
      },
    },
    { $sort: { quantity: -1 } },
  ]);

  //CONSEGUIR LOS RETIROS DE RANGO ACTUAL
  const totalMaterials = await Removals.aggregate([
    {
      $match: {
        ...removalsQ.removalQueries["COMPLETE"],
        localID: { $in: locals.map((local) => local._id) },
        datetimeRemoval: { $lt: dateFinish, $gt: dateInit },
      },
    },
    { $project: { _id: 0, materials: 1 } },
    { $unwind: "$materials" },
    {
      $group: {
        _id: "$materials.material",
        quantity: { $sum: "$materials.quantity" },
      },
    },
    { $sort: { quantity: -1 } },
  ]);

  var ecoeq = [
    { ID: "TREE", q: 0, unity: "Un" },
    { ID: "WATER", q: 0, unity: "L" },
    { ID: "PETROL", q: 0, unity: "L" },
    { ID: "ENERGY", q: 0, unity: "kWatt" },
    { ID: "CO2", q: 0, unity: "Kg" },
  ];

  totalMaterials.map((element) => {
    let temp = ecoData.filter(
      (material) => material.materialID === element._id
    )[0];
    temp.savesPerKilogram.forEach((el) => {
      for (let i = 0; i < ecoeq.length; i++) {
        if (ecoeq[i].ID === el.ID) {
          ecoeq[i].q += el.quantity * element.quantity;
        }
      }
    });
  });

  return res
    .status(200)
    .send({ totalMaterials, totalMaterialsPrevius, ecoeq, removals, locals });
};
