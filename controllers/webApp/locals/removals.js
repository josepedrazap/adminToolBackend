const Removals = require("../../../models/removals");
const Locals = require("../../../models/locals");
const Transporters = require("../../../models/transporters");
const Customers = require("../../../models/customers");
const pdfUpload = require("../../../services/pdfUpload");

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

exports.getRemovals = async (req, res) => {
  const now = new Date();
  console.log("enviando data");
  res.io.emit(
    "ok",
    JSON.stringify({
      type: "message",
      text: "Buena, me conecte desde el back"
    })
  );
  var removals = await Removals.find({
    localID: req.entityID,
    datetimeRemoval: {
      $gt: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 1),
      $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    },
    status: { $in: ["COMPLETE", "PENDING_TRANS", "PENDING_PAYMENT"] }
  })
    .populate("transporterID")
    .sort({ datetimeRemoval: "asc" });

  const local = await Locals.findOne({ _id: req.entityID });

  var dates = [];
  const maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  for (let i = 0; i < local.removals; i++) {
    dates.push(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        (maxDate / local.removals) * (i + 1),
        11,
        0,
        0
      )
    );
  }
  let lastDate = null;

  let payload = [];

  let maxLength = 0;

  if (local.removals > removals.length) {
    maxLength = local.removals;
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
