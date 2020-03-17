const Locals = require("../../models/locals");
const Customers = require("../../models/customers");

exports.create = (req, res) => {
  Locals.create(req.body.locals, (err, locals) => {
    if (err) {
      console.log(err);
    }
    if (locals) {
      Customers.findOne({
        _id: req.body.locals[0].customer
      }).exec((_err, customer) => {
        if (customer) {
          var aux = customer.localsID;
          locals.forEach(local => {
            aux.push(local._id);
          });
          customer.localsID = aux;
          customer.save();
          return res.status(200).send(locals);
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
  Locals.findOneAndUpdate({ _id: req.body._id }, req.body).exec(
    (_err, local) => {
      return res.status(200).send(local);
    }
  );
};

exports.retrieve = async (req, res) => {
  const customers = await Customers.find({ status: "READY" }).populate(
    "localsID"
  );
  const locals = [];
  await customers.forEach(customer => {
    customer.localsID.forEach(element => {
      if (element.status !== "DELETED") {
        locals.push({ element, name: customer.brand + " - " + element.name });
      }
    });
  });
  return res.status(200).send(locals);
};

exports.getDataCreateLocal = async (req, res) => {
  const customers = await Customers.find({ status: "READY" });
  return res.status(200).send(customers);
};

exports.delete = (req, res) => {
  Locals.findOneAndUpdate(
    { _id: req.query.localID },
    { status: "DELETED" }
  ).exec((_err, local) => {
    return res.status(200).send(local);
  });
};
