const Removals = require("../../models/removals");
const Locals = require("../../models/locals");
const Transporters = require("../../models/transporters");
const pdfUpload = require("../../services/pdfUpload");
const Customers = require("../../models/customers");
const AuctionRequests = require("../../models/auctionRequests");
const removalsQ = require("../../queries/removalsQueries");

const removalQueries = removalsQ.removalQueries;

const searchEngine = async (search) => {
  if (search.type === "LOCAL") {
    const locals = await Locals.find({
      name: {
        $regex: ".*" + search.firstParam.toLowerCase() + ".*",
        $options: "i",
      },
    });
    search.search = {
      localID: { $in: locals.map((local) => local._id) },
    };
  }
  if (search.type === "TRANSPORTER") {
    const trans = await Transporters.find({
      $or: [
        { name: { $regex: search.firstParam.toLowerCase(), $options: "i" } },
        {
          lastName: { $regex: search.firstParam.toLowerCase(), $options: "i" },
        },
      ],
    });
    search.search = {
      transporterID: { $in: trans.map((tran) => tran._id) },
    };
  }
  return search;
};

exports.retriveRemovals = async (req, res) => {
  var data = req.query;
  data.search = JSON.parse(data.search);
  if (data.search.type === "LOCAL" || data.search.type === "TRANSPORTER") {
    data.search = await searchEngine(data.search);
  }
  try {
    let removals = await Removals.find({
      ...removalQueries[data.select],
      ...data.search.search,
    })
      .populate("localID")
      .populate("transporterID")
      .populate("lastModificationID");

    removals = await Locals.populate(removals, {
      path: "localID.customerID",
      model: "Customer",
    });

    return res.status(200).send(removals);
  } catch (e) {
    return res.status(400).send([]);
  }
};

exports.cards = async (req, res) => {
  const completes = await Removals.countDocuments({
    ...removalQueries.COMPLETE,
  });
  const incompletes = await Removals.countDocuments({
    ...removalQueries.INCOMPLETE,
  });
  const suscription = await Removals.countDocuments({
    ...removalQueries.SUSCRIPTION,
  });
  const extra = await Removals.countDocuments({
    ...removalQueries.EXTRA,
  });
  return res.status(200).send({ completes, incompletes, suscription, extra });
};

exports.retriveRemovalsAuction = async (req, res) => {
  const removals = await Removals.find({ status: "IN_AUCTION" })
    .populate("localID")
    .populate("transporterID");

  Locals.populate(
    removals,
    { path: "localID.customerID", model: "Customer" },
    async (_err, removals) => {
      var payload = [];

      for (let i = 0; i < removals.length; i++) {
        let auction = await AuctionRequests.find({
          removalID: removals[i]._id,
        }).populate("transporterID");
        payload.push({ removal: removals[i], auction });
      }
      return res.status(200).send(payload);
    }
  );
};

exports.getDataCreateRemoval = async (req, res) => {
  const locals = await Locals.find({ status: "READY" }).populate("customerID");
  const transporters = await Transporters.find();
  return res.status(200).send({ locals, transporters });
};

exports.patchRemoval = async (req, res) => {
  console.log(req.body);
  var removal = null;

  var data = {
    ...req.body,
    author: "ADMIN",
    lastModificationID: req.userID,
    datetimeLastModification: Date.now(),
  };

  if (data._id) {
    removal = await Removals.findOneAndUpdate({ _id: data._id }, { ...data });
  } else {
    delete data._id;
    removal = await Removals.create({ ...data });
  }

  if (data.file) {
    try {
      var response = await pdfUpload.index({
        pdf: data.file,
        name: removal._id,
      });
      removal.urlReport = response;
      removal.save();
      return res.status(200).send(removal);
    } catch (e) {
      return res.status(412).send(e);
    }
  } else {
    return res.status(200).send(removal);
  }
};

exports.deleteRemoval = async (req, res) => {
  const removal = await Removals.findOneAndUpdate(
    { _id: req.query.removalID },
    { status: "DELETED" }
  );
  return res.status(200).send(removal);
};

exports.statsRemovals = async (req, res) => {
  var dateInit = new Date(req.query.dateInit.replace(/['"]+/g, ""));
  var dateFinish = new Date(req.query.dateFinish.replace(/['"]+/g, ""));

  var removalsPerLocal = await Removals.aggregate([
    {
      $match: {
        status: "COMPLETE",
        datetimeRemoval: { $lt: dateFinish, $gt: dateInit },
      },
    },
    {
      $lookup: {
        from: "locals",
        localField: "localID",
        foreignField: "_id",
        as: "local",
      },
    },
    { $unwind: "$local" },
    {
      $project: {
        name: "$local.name",
        customerID: "$local.customerID",
        payment: "$payment",
        suscription: "$local.suscription",
      },
    },
    {
      $group: {
        _id: {
          name: "$name",
          suscription: "$suscription",
          customerID: "$customerID",
        },
        total: { $sum: "$payment" },
        quantity: { $sum: 1 },
      },
    },
  ]);

  removalsPerLocal = await Locals.populate(removalsPerLocal, {
    path: "_id.customerID",
    model: "Customer",
  });
  const totalMaterials = await Removals.aggregate([
    {
      $match: {
        status: "COMPLETE",
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

  const removalsRate = await Removals.aggregate([
    {
      $match: {
        status: "COMPLETE",
        datetimeRemoval: { $lt: dateFinish, $gt: dateInit },
      },
    },
    {
      $group: {
        _id: { $dayOfMonth: "$datetimeRemoval" },
        total: {
          $sum: "$payment",
        },
        cont: {
          $sum: 1,
        },
      },
    },
  ]);
  var removalsRates = [];
  for (let i = 0; i < 31; i++) {
    removalsRates[i] = { cont: 0, total: 0, date: i + 1 };
    removalsRate.forEach((element) => {
      if (parseInt(element._id) === i) {
        removalsRates[i] = {
          cont: element.cont,
          total: element.total,
          date: i + 1,
        };
      }
    });
  }
  return res
    .status(200)
    .send({ removalsPerLocal, removalsRates, totalMaterials });
};

exports.tempremovals = async (req, res) => {
  const dateNow = new Date();
  const datetimeInit = new Date(
    dateNow.getFullYear(),
    dateNow.getMonth(),
    1,
    0
  );
  const datetimeFinish = new Date(
    dateNow.getFullYear(),
    dateNow.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  var locals = await Locals.find({ status: "READY" }).populate("customerID");
  var data = [];

  var pendings = 0;
  var allRemovals = 0;

  for (let i = 0; i < locals.length; i++) {
    var removals = await Removals.find({
      localID: locals[i]._id,
      datetimeRequest: { $gt: datetimeInit },
      status: { $ne: "DELETED" },
    });

    var allDates = [];
    let dates = [];

    for (let j = 0; j < removals.length; j++) {
      // RETIROS QUE YA EXISTEN O ESTAN SIENDO SUBASTADOS
      if (removals[j].status === "IN_AUCTION") {
        var requests = await AuctionRequests.find({
          removalID: removals[j]._id,
        }).populate("transporterID");
        allDates.push({
          date: removals[j].datetimeRemoval,
          status: removals[j].status,
          requests,
        });
      } else {
        allDates.push({
          date: removals[j].datetimeRemoval,
          status: removals[j].status,
        });
      }
    }
    // RETIROS QUE AUN NO EXISTEN Y DEBEN CREARSE

    for (let j = removals.length; j < locals[i].removals; j++) {
      let aux = new Date(
        dateNow.getFullYear(),
        dateNow.getMonth(),
        parseInt((datetimeFinish.getDate() * j) / locals[i].removals) + 1
      );

      // Desplaza un sabado al viernes anterior
      if (aux.getDay() === 6) {
        aux = new Date(
          dateNow.getFullYear(),
          dateNow.getMonth(),
          parseInt((datetimeFinish.getDate() * j) / locals[i].removals)
        );
      }
      // Desplaza un domingo al lunes siguiente
      if (aux.getDay() === 0) {
        aux = new Date(
          dateNow.getFullYear(),
          dateNow.getMonth(),
          parseInt((datetimeFinish.getDate() * j) / locals[i].removals) + 2
        );
      }

      allDates.push({ date: aux, status: "NOT_REQUEST" });
      dates.push(aux);
    }

    // INGRESAR TODOS LOS DATOS A DATA
    data.push({
      local: {
        ...locals[i]._doc,
        name: locals[i].customerID.brand + " " + locals[i].name,
      },
      qRemovals: locals[i].removals,
      cRemovals: removals.length,
      dates,
      allDates,
    });
    pendings += locals[i].removals - removals.length;
    allRemovals += locals[i].removals;
  }

  return res.status(200).send({ data, pendings, allRemovals });
};
