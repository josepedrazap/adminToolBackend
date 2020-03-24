const Users = require("../models/user");
const Locals = require("../models/locals");
const Customers = require("../models/customers");
const PasswordGen = require("../services/passwordGen");
const TokensGen = require("../services/tokensGen");
const Mailer = require("../services/mailer");

const tokenActivateUser = user => {
  const now = Date.now();
  let payload = {
    userID: user._id,
    exp: new Date(now + 21600000), // 6 horas de validez
    email: user.email
  };
  TokensGen.createToken(payload).then(response => {
    Mailer.sendEmail({
      to: user.email,
      type: "NEW_USER_VERIFY",
      user,
      url: "http://localhost:3000/adminTool/users/activate?token=" + response
    });
  });
};

exports.createUser = (req, res) => {
  Users.create(req.body, (err, user) => {
    if (err) {
      console.log(err);
    }
    return res.status(200).send(user);
  });
};

exports.assignUserToEntity = async (req, res) => {
  const data = req.body;
  var entity = null;
  if (data.type === "LOCAL") {
    entity = await Locals.findOne({ _id: data.entityID });
  }
  if (data.type === "CUSTOMER") {
    entity = await Customers.findOne({ _id: data.entityID });
  }

  if (entity) {
    var user = await Users.create({
      ...data,
      password: PasswordGen.hash(data.password).hash,
      email: data.email.toLowerCase()
    });
    if (user) {
      entity.users.push(user._id);
      entity.save();
      tokenActivateUser(user);
      return res.status(200).send(user);
    } else {
      return res.status(413).send();
    }
  } else {
    return res.status(412).send();
  }
};

exports.getUsers = (req, res) => {
  Users.find({ type: { $ne: "ADMIN" } }).exec(async (_err, users) => {
    if (users) {
      var locals = [];
      var customers = [];

      users.forEach(user => {
        if (user.type === "LOCAL") {
          locals.push(user);
        }
        if (user.type === "CUSTOMER") {
          customers.push(user);
        }
      });
      locals = await Users.populate(locals, {
        path: "entityID",
        model: "Local"
      });
      customers = await Users.populate(customers, {
        path: "entityID",
        model: "Customer"
      });

      var payload = locals.concat(customers);
      return res.status(200).send(payload);
    } else {
      return res.status(404).send();
    }
  });
};

exports.patchUser = (req, res) => {
  Users.findOneAndUpdate({ _id: req.body.userID }, req.body).exec(
    (err, user) => {
      if (err) {
        console.log(err);
      }
      return res.status(200).send(user);
    }
  );
};

exports.deleteUser = (req, res) => {
  Users.findOne({ _id: req.query.userID }, async (_err, user) => {
    if (user) {
      if (user.type === "CUSTOMER") {
        let customer = await Customers.findOne({ _id: user.entityID });
        customer.users = customer.users.filter(
          userID => String(userID) !== String(user._id)
        );
        customer.save();
      }
      if (user.type === "LOCAL") {
        let local = await Locals.findOne({ _id: user.entityID });
        local.users = local.users.filter(
          userID => String(userID) !== String(user._id)
        );
        local.save();
      }

      var eliminated = await Users.deleteOne({ _id: user._id });
      return res.status(200).send(user);
    } else {
      return res.status(404).send();
    }
  });
};

exports.activateUser = (req, res) => {
  const token = req.query.token;
  TokensGen.decodeToken(token).then(response => {
    if (new Date() < new Date(response.exp)) {
      Users.findOneAndUpdate({ _id: response.userID }, { activate: 1 }).exec(
        (_err, user) => {
          if (user) {
            return res.render("activateUserSuccess", { email: response.email });
          } else {
            return res.status(400).send("NO ACTIVADO");
          }
        }
      );
    } else {
      return res.status(400).send("TOKEN EXPIRADO");
    }
  });
};
