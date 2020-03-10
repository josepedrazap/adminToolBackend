const Locals = require('../models/locals')

exports.create = (req, res) => {
  Locals.create(req.body, (err, transporter) => {
    if (err) {
      console.log(err)
    }
    return res.status(200).send(transporter)
  })
}
