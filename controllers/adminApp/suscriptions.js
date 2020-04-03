const Suscriptions = require("../../models/suscriptions");

exports.createSuscription = (req, res) => {
  Suscriptions.create(req.body, (_err, suscription) => {
    if (suscription) {
      return res.status(200).send();
    } else {
      return res.status(400).send();
    }
  });
};

exports.getSuscriptions = (req, res) => {
  Suscriptions.find().exec((_err, suscriptions) => {
    if (suscriptions) {
      return res.status(200).send(suscriptions);
    } else {
      return res.status(404).send();
    }
  });
};
