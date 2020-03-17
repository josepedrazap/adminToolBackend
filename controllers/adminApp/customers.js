const Customers = require("../../models/customers");
const Locals = require("../../models/locals");

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
  const data = req.query;

  Customers.find({ status: "READY" })
    .populate("localsID")
    .exec((_err, customers) => {
      if (customers) {
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
