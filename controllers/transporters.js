const TransAdminTool = require('../models/transporters')

exports.create = (req, res) => {
  TransAdminTool.create(req.body, (err, transporter) => {
    if (err) {
      console.log(err)
    }
    return res.status(200).send(transporter)
  })
}

exports.getTransporters = (req, res) => {
  TransAdminTool.find().exec((err, transporters) => {
    if (err) {
      console.log(err)
    }
    return res.status(200).send(transporters)
  })
}
