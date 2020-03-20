const Removals = require("../../models/removals");
const Locals = require("../../models/locals");
const Transporters = require("../../models/transporters");
const pdfUpload = require("../../services/pdfUpload");
const Customers = require("../../models/customers");
const AuctionRequests = require("../../models/auctionRequests");

exports.index = async (req, res) => {
  // RETIROS COMPLETOS CON MATERIALES AGREGADOS
  var completes = await (await Removals.find({ status: "COMPLETE" })).filter(
    removal =>
      removal.materials.reduce(
        (total, current) => (total += current.quantity),
        0
      ) !== 0
  ).length;
  // RETIROS EN SUBASTA
  const auction = await (await Removals.find({ status: "IN_AUCTION" })).length;

  // RETIROS SIN MATERIAL
  const incompletes = await (
    await Removals.find({
      status: { $in: ["PENDING_TRANS", "PENDING_PAYMENT", "COMPLETE"] }
    })
  ).filter(
    removal =>
      removal.materials.reduce(
        (total, current) => (total += current.quantity),
        0
      ) === 0
  ).length;

  const locals = await Locals.find({ status: "READY" });
  const now = new Date();
  let pendings = 0;

  for (let i = 0; i < locals.length; i++) {
    var removals = await Removals.find({
      localID: locals[i]._id,
      status: { $ne: "DELETED" },
      datetimeRemoval: { $gt: new Date(now.getFullYear(), now.getMonth(), 1) }
    });
    pendings += locals[i].removals - removals.length;
  }

  return res.status(200).send({ completes, auction, incompletes, pendings });
};

exports.retriveRemovals2 = async (req, res) => {
  var search = JSON.parse(req.query.searchData);

  if (search.type === "LOCAL") {
    const locals = await Locals.find({
      name: { $regex: ".*" + search.search.toLowerCase() + ".*" }
    });
    search.search = {
      localID: { $in: locals.map(local => local._id) }
    };
  }
  if (search.type === "TRANSPORTER") {
    const trans = await Transporters.find({
      $or: [
        { name: { $regex: search.search.toLowerCase(), $options: "i" } },
        { lastName: { $regex: search.search.toLowerCase(), $options: "i" } }
      ]
    });
    search.search = {
      transporterID: { $in: trans.map(tran => tran._id) }
    };
  }

  Removals.find({ status: { $nin: ["DELETED", "IN_AUCTION"] } })
    .populate("localID")
    .populate("transporterID")
    .populate("lastModificationID")
    .exec((err, removals) => {
      if (err) {
        console.log(err);
        return res.status(400).send(err);
      }
      Locals.populate(
        removals,
        { path: "localID.customerID", model: "Customer" },
        (_err, removals) => {
          return res.status(200).send(removals);
        }
      );
    });
};

exports.retriveRemovals = (req, res) => {
  console.log(req.query.type);
  var query = {};

  if (req.query.type === "COMPLETE") {
    query = {
      status: "COMPLETE"
    };
  } else {
    query = {
      status: { $in: ["PENDING_TRANS", "PENDING_PAYMENT", "COMPLETE"] }
    };
  }

  Removals.find(query)
    .populate("localID")
    .populate("transporterID")
    .populate("lastModificationID")
    .exec((err, removals) => {
      if (err) {
        console.log(err);
        return res.status(400).send(err);
      }
      if (req.query.type === "COMPLETE") {
        removals = removals.filter(
          removal =>
            removal.materials.reduce(
              (total, current) => (total += current.quantity),
              0
            ) !== 0
        );
      } else {
        removals = removals.filter(
          removal =>
            removal.materials.reduce(
              (total, current) => (total += current.quantity),
              0
            ) === 0
        );
      }

      Locals.populate(
        removals,
        { path: "localID.customerID", model: "Customer" },
        (_err, removals) => {
          return res.status(200).send(removals);
        }
      );
    });
};

exports.getDataCreateRemoval = async (req, res) => {
  const customers = await Customers.find({ status: "READY" }).populate(
    "localsID"
  );
  const locals = [];
  await customers.forEach(customer => {
    customer.localsID.forEach(element => {
      if (element.status !== "DELETED") {
        locals.push({
          ...element,
          name: customer.brand + " - " + element.name
        });
      }
    });
  });
  const trasportists = await Transporters.find();
  return res.status(200).send({ locals, trasportists });
};

exports.createRemoval = async (req, res) => {
  let status = "PENDING_TRANS";
  var removal = null;
  const author = "ADMIN";

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
        datetimeRemoval: { $lt: dateFinish, $gt: dateInit }
      }
    },
    {
      $lookup: {
        from: "locals",
        localField: "localID",
        foreignField: "_id",
        as: "local"
      }
    },
    { $unwind: "$local" },
    {
      $project: {
        name: "$local.name",
        customerID: "$local.customerID",
        payment: "$payment",
        suscription: "$local.suscription"
      }
    },
    {
      $group: {
        _id: {
          name: "$name",
          suscription: "$suscription",
          customerID: "$customerID"
        },
        total: { $sum: "$payment" },
        quantity: { $sum: 1 }
      }
    }
  ]);

  removalsPerLocal = await Locals.populate(removalsPerLocal, {
    path: "_id.customerID",
    model: "Customer"
  });
  const totalMaterials = await Removals.aggregate([
    {
      $match: {
        status: "COMPLETE",
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

  const removalsRate = await Removals.aggregate([
    {
      $match: {
        status: "COMPLETE",
        datetimeRemoval: { $lt: dateFinish, $gt: dateInit }
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: "$datetimeRemoval" },
        total: {
          $sum: "$payment"
        },
        cont: {
          $sum: 1
        }
      }
    }
  ]);
  var removalsRates = [];
  for (let i = 0; i < 31; i++) {
    removalsRates[i] = { cont: 0, total: 0, date: i + 1 };
    removalsRate.forEach(element => {
      if (parseInt(element._id) === i) {
        removalsRates[i] = {
          cont: element.cont,
          total: element.total,
          date: i + 1
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
      status: { $ne: "DELETED" }
    });

    var allDates = [];
    let dates = [];

    for (let j = 0; j < removals.length; j++) {
      // RETIROS QUE YA EXISTEN O ESTAN SIENDO SUBASTADOS
      if (removals[j].status === "IN_AUCTION") {
        var requests = await AuctionRequests.find({
          removalID: removals[j]._id
        }).populate("transporterID");
        allDates.push({
          date: removals[j].datetimeRemoval,
          status: removals[j].status,
          requests
        });
      } else {
        allDates.push({
          date: removals[j].datetimeRemoval,
          status: removals[j].status
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
        name: locals[i].customerID.brand + " " + locals[i].name
      },
      qRemovals: locals[i].removals,
      cRemovals: removals.length,
      dates,
      allDates
    });
    pendings += locals[i].removals - removals.length;
    allRemovals += locals[i].removals;
  }

  return res.status(200).send({ data, pendings, allRemovals });
};
