const Customers = require("../../models/customers");
const Locals = require("../../models/locals");
const Removals = require("../../models/removals");
const ecoData = require("../../files/ecoData.json");

exports.create = (req, res) => {
  var data = req.body;

  Customers.create(data.customer, (_err, customer) => {
    if (customer) {
      data.locals = data.locals.map(local => {
        return {
          ...local,
          customerID: customer._id
        };
      });
      Locals.create(data.locals, (_err, locals) => {
        if (locals) {
          customer.localsID = locals.map(local => local._id);
          customer.save();
          return res.status(200).send(customer);
        } else {
          return res.status(400).send();
        }
      });
    } else {
      return res.status(400).send();
    }
  });
};

exports.update = (req, res) => {
  Customers.findOneAndUpdate({ _id: req.body._id }, req.body).exec(
    (_err, customer) => {
      return res.status(200).send(customer);
    }
  );
};

exports.retrieve = (req, res) => {
  Customers.find({ status: "READY" })
    .populate("localsID")
    .exec(async (_err, customers) => {
      if (customers) {
        customers = await Locals.populate(customers, {
          path: "localsID.suscriptionID",
          model: "Suscription"
        });

        customers.forEach(customer => {
          customer.localsID = customer.localsID.filter(
            local => local.status !== "DELETED"
          );
        });
        return res.status(200).send(customers);
      } else {
        return res.status(404).send();
      }
    });
};

exports.delete = (req, res) => {
  Customers.findOneAndUpdate(
    { _id: req.query.customerID },
    { status: "DELETED" }
  ).exec((_err, customer) => {
    Locals.updateMany(
      { _id: { $in: customer.localsID } },
      { status: "DELETED" },
      (_err, locals) => {
        return res.status(200).send(customer);
      }
    );
  });
};

exports.stats = async (req, res) => {
  var dateInit = new Date(req.query.dateInit.replace(/['"]+/g, ""));
  var dateFinish = new Date(req.query.dateFinish.replace(/['"]+/g, ""));

  const locals = await Locals.find({ customerID: req.query.customerID });

  const removals = await Removals.find({
    status: "COMPLETE",
    localID: { $in: locals.map(local => local._id) },
    datetimeRemoval: { $lt: dateFinish, $gt: dateInit }
  })
    .populate("localID")
    .populate("transporterID");

  const totalMaterials = await Removals.aggregate([
    {
      $match: {
        status: "COMPLETE",
        localID: { $in: locals.map(local => local._id) },
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
  // ecoeq = {
  //   tree: ecoeq[0].q,
  //   water: ecoeq[1].q,
  //   petrol: ecoeq[2].q,
  //   energy: ecoeq[3].q,
  //   co2: ecoeq[4].q
  // };
  return res.status(200).send({ totalMaterials, ecoeq, removals });
};
