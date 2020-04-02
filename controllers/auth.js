const bcrypt = require("bcryptjs");
const User = require("../models/user");
const WorkingToken = require("../models/workingTokens");
const service = require("../services");

exports.login = (req, res) => {
  console.log(req.body);
  User.findOne({
    email: req.body.email.toLowerCase()
  }).exec((err, user) => {
    if (err) {
      return res.status(400);
    }
    if (!user) {
      return res.status(404).send({
        error: "USER_NOT_FOUND"
      });
    }
    bcrypt.compare(req.body.password, user.password, (err, resp) => {
      if (err) {
        return res.status(400).send(err);
      }
      if (resp) {
        service
          .createToken(user)
          .then(response => {
            if (true || usr.activate) {
              res.status(200).send({
                token: response,
                userID: user.userID,
                email: user.email,
                type: user.type,
                activate: user.activate,
                name: user.name,
                lastName: user.lastName,
                phone: user.phone
              });
            } else {
              res.status(401).send({
                error: "USER_NOT_ACTIVATED"
              });
            }
          })
          .catch(response =>
            res.status(401).send({
              error: response.error
            })
          );
      } else {
        return res.status(403).send({ error: "INCORRECT_PASS" });
      }
    });
    return null;
  });
};
exports.logout = (req, res) => {
  WorkingToken.deleteOne(
    {
      _id: req.tokenID
    },
    err => {
      if (err) {
        throw err;
      }
      return res.status(200).send("LOGOUT");
    }
  );
};
exports.tokenCheck = (req, res) => {
  res.status(200).send();
};
