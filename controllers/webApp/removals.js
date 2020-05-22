const Removals = require("../../models/removals");
const Locals = require("../../models/locals");
const Materials = require("../../models/materials");
const ImageUpload = require("../../services/imageUpload.js");
const removalsQ = require("../../queries/removalsQueries");

const materials = [
  { material: "CEL", quantity: 0 },
  { material: "PLASTIC", quantity: 0 },
  { material: "GLASS", quantity: 0 },
  { material: "ALUMINIUM", quantity: 0 },
  { material: "METALS", quantity: 0 },
  { material: "TETRAPAK", quantity: 0 },
  { material: "ORGANICS", quantity: 0 },
  { material: "ELECTRONICS", quantity: 0 },
  { material: "TEXTILS", quantity: 0 },
];

const calculateOptimizedDates = (removals) => {
  var dates = [];
  const now = new Date();

  // ÚLTIMO DÍA DEL MES. SE USA PARA REALIZAR LA DIVISIÓN DEL MES POR LA CANTIDAD DE RETIROS DEL LOCAL
  const maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today = now.getDate();

  const lambda = (maxDate - today) / removals;

  console.log(lambda);

  // CONSIGUIENDO LAS FECHAS TENTATIVAS PARA PEDIR LOS RETIROS
  for (let i = 0; i < removals; i++) {
    dates.push(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        today + lambda * (i + 1),
        11,
        0,
        0
      )
    );
  }
  return dates;
};

exports.createRemoval = async (req, res) => {
  // const materials = await Materials.create({});
  Removals.create(
    {
      author: "WEBAPP_SUSCRIPTION",
      datetimeRemoval: req.body.datetimeRemoval,
      localID: req.body.localID,
      description: req.body.description,
      materials,
    },
    (_err, removal) => {
      if (removal) {
        if (req.body.image) {
          ImageUpload.index({
            urlImage: req.body.image,
            path: "removalImages",
            id: removal._id,
          })
            .then((response) => {
              removal.image = response;
              removal.save();
              return res.status(200).send({ removal });
            })
            .catch((err) => {
              return res.status(400).send();
            });
        } else {
          return res.status(200).send({ removal });
        }
      } else {
        return res.status(400).send();
      }
    }
  );
};

exports.getRemovals = async (req, res) => {
  // CARGAR LOCAL

  if (req.query.localID === "ALL") {
    return res.status(200).send([]);
  }

  const local = await Locals.findOne({ _id: req.query.localID }).populate(
    "suscriptionID"
  );

  if (!local.suscriptionID) {
    return res.status(407).send();
  }

  const removalsLength = local.suscriptionID.removals;
  const now = new Date();

  // CONSEGUIR RETIROS DEL MES
  var removals = await Removals.find({
    localID: req.query.localID,
    datetimeRemoval: {
      $gt: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 1),
      $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    },
    status: { $ne: "DELETED" },
  })
    .populate("materialsID")
    .populate("transporterID")
    .sort({ datetimeRemoval: "asc" });

  // CORE
  var payload = [];
  for (let i = 0; i < removals.length; i++) {
    lastDate = removals[i].datetimeRemoval;
    payload.push(removals[i]);
  }
  if (removalsLength - removals.length > 0) {
    calculateOptimizedDates(removalsLength - removals.length).forEach(
      (date) => {
        payload.push({
          status: "AVAILABLE",
          datetimeRemoval: date,
        });
      }
    );
  }
  return res.status(200).send(payload);
};

exports.getPreviusRemovals = async (req, res) => {
  if (req.query.localID === "ALL") {
    return res.status(200).send([]);
  }
  const now = new Date();
  var removals = await Removals.find({
    localID: req.query.localID,
    datetimeRemoval: {
      $gt: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 1),
      $lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    },
    status: { $in: ["COMPLETE", "PENDING_TRANS", "PENDING_PAYMENT"] },
  })
    .populate("transporterID")
    .populate("transporterID")
    .sort({ datetimeRemoval: "asc" });
  return res.status(200).send(removals);
};

exports.getHistoricRemovals = async (req, res) => {
  if (req.query.localID === "ALL") {
    return res.status(200).send([]);
  }
  var removals = await Removals.find({
    ...removalsQ.removalQueries["COMPLETE"],
    localID: req.query.localID,
    status: { $ne: "DELETED" },
  })
    .populate("transporterID")
    .sort({ datetimeRemoval: "asc" });

  return res.status(200).send(removals);
};

exports.setRemovalRating = async (req, res) => {
  const removal = await Removals.findOneAndUpdate(
    { _id: req.body.removalID },
    { rating: req.body.rating }
  );
  return res.status(200).send(removal);
};
