const Removals = require("../../../models/removals");
const Locals = require("../../../models/locals");
const Transporters = require("../../../models/transporters");
const Customers = require("../../../models/customers");
const pdfUpload = require("../../../services/pdfUpload");
const RemovalIntents = require("../../../models/removalIntents");
const ImageUpload = require("../../../services/imageUpload.js");

const materials = [
  { material: "CEL", quantity: 0 },
  { material: "PLASTIC", quantity: 0 },
  { material: "GLASS", quantity: 0 },
  { material: "ALUMINIUM", quantity: 0 },
  { material: "METALS", quantity: 0 },
  { material: "TETRAPAK", quantity: 0 },
  { material: "ORGANICS", quantity: 0 },
  { material: "ELECTRONICS", quantity: 0 },
  { material: "TEXTILS", quantity: 0 }
];

exports.createRemoval = async (req, res) => {
  Removals.create(
    {
      author: "WEBAPP",
      datetimeRemoval: req.body.datetimeRemoval,
      localID: req.entity,
      description: req.body.description,
      materials
    },
    (_err, removal) => {
      if (removal) {
        if (req.body.image) {
          ImageUpload.index({
            urlImage: req.body.image,
            path: "removalImages",
            id: removal._id
          }).then(response => {
            removal.image = response;
            removal.save();
            return res.status(200).send({ removal });
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
  const local = await Locals.findOne({ _id: req.entityID }).populate(
    "suscriptionID"
  );

  if (!local.suscriptionID) {
    return res.status(407).send();
  }

  const removalsLenth = local.suscriptionID.removals;

  const now = new Date();

  // CONSEGUIR RETIROS
  var removals = await Removals.find({
    localID: req.entityID,
    datetimeRemoval: {
      $gt: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 1),
      $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    },
    status: { $in: ["COMPLETE", "PENDING_PAYMENT", "PENDING_TRANS"] }
  })
    .populate("transporterID")
    .sort({ datetimeRemoval: "asc" });

  // VARIABLE QUE CONTENDRÁ LAS FECHAS TENTATIVAS PARA LOS RETIROS DEL MES
  var dates = [];

  // ÚLTIMO DÍA DEL MES. SE USA PARA REALIZAR LA DIVISIÓN DEL MES POR LA CANTIDAD DE RETIROS DEL LOCAL
  const maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // CONSIGUIENDO LAS FECHAS TENTATIVAS PARA PEDIR LOS RETIROS
  for (let i = 0; i < removalsLenth; i++) {
    dates.push(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        (maxDate / removalsLenth) * (i + 1),
        11,
        0,
        0
      )
    );
  }

  // VARIABLE AUXILIAR PARA GUARDAR LA ULTIMA FECHA DEL CICLO
  let lastDate = null;

  // VARIABLE QUE ALOJA LA CARGA DE LA RESPUESTA
  let payload = [];

  // TAMAÑO DEL CICLO FOR. PUEDE SER POR LA CANTIDAD DE RETIROS REALIZADOS O POR LA CANTIDAD DE RETIROS PEDIDOS EN EL MES.
  // NO SON NECESARIAMENTE IGUALES YA QUE EXISTEN LOS PEDIDOS EXTRAS
  let maxLength = 0;

  if (removalsLenth > removals.length) {
    maxLength = removalsLenth;
  } else {
    maxLength = removals.length;
  }

  for (let i = 0; i < maxLength; i++) {
    if (i < removals.length) {
      lastDate = removals[i].datetimeRemoval;
      payload.push(removals[i]);
    } else {
      if (new Date(dates[i]) >= new Date(lastDate)) {
        payload.push({
          status: "AVAILABLE",
          datetimeRemoval: dates[i]
        });
      } else {
        payload.push({
          status: "AVAILABLE",
          datetimeRemoval: lastDate
        });
      }
    }
  }
  return res.status(200).send(payload);
};

exports.getPrevRemovals = async (req, res) => {
  const now = new Date();

  var removals = await Removals.find({
    localID: req.entityID,
    datetimeRemoval: {
      $gt: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 1),
      $lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    },
    status: { $in: ["COMPLETE", "PENDING_TRANS", "PENDING_PAYMENT"] }
  })
    .populate("transporterID")
    .sort({ datetimeRemoval: "asc" });

  return res.status(200).send(removals);
};

exports.getHistoricRemovals = async (req, res) => {
  const now = new Date();

  var removals = await Removals.find({
    localID: req.entityID,
    status: { $in: ["COMPLETE", "PENDING_TRANS", "PENDING_PAYMENT"] }
  })
    .populate("transporterID")
    .sort({ datetimeRemoval: "asc" });

  return res.status(200).send(removals);
};
