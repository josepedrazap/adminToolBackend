const bcrypt = require('bcryptjs')
const User = require('../models/user')
const WorkingToken = require('../models/workingTokens')
const service = require('../services')

exports.login = (req, res) => {
  User.findOne({
    email: req.body.email.toLowerCase()
  }).exec((err, usr) => {
    if (err) {
      return res.status(400)
    }
    if (!usr) {
      return res.status(404).send({
        error: 'USER_NOT_FOUND'
      })
    }
    bcrypt.compare(req.body.password, usr.password, (err, resp) => {
      if (err) {
        return res.status(400).send(err)
      }
      if (resp) {
        service
          .createToken(usr)
          .then(response => {
            if (true || usr.activate) {
              res.status(200).send({
                token: response,
                userID: usr.userID,
                email: usr.email,
                type: usr.type,
                activate: usr.activate,
                name: usr.name,
                lastName: usr.lastName,
                phone: usr.phone
              })
            } else {
              res.status(401).send({
                error: 'USER_NOT_ACTIVATED'
              })
            }
          })
          .catch(response =>
            res.status(401).send({
              error: response.error
            })
          )
      } else {
        return res.status(403).send({ error: 'INCORRECT_PASS' })
      }
    })
    return null
  })
}
exports.logout = (req, res) => {
  WorkingToken.deleteOne(
    {
      _id: req.tokenID
    },
    err => {
      if (err) {
        throw err
      }
      return res.status(200).send('LOGOUT')
    }
  )
}
exports.tokenCheck = (req, res) => {
  res.status(200).send()
}
