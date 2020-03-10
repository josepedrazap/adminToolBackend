const Users = require('../models/user')

exports.createUser = (req, res) => {
  Users.create(req.body, (err, user) => {
    if (err) {
      console.log(err)
    }
    return res.status(200).send(user)
  })
}

exports.getUsers = (req, res) => {
  Users
    .find({ type: 'MATRIX' })
    .populate({ path: 'entityID', model: 'Matrix' })
    .populate({ path: 'entityID.dataEntity', model: 'DataEntity' })
    .exec((err, usersMatrix) => {
      if (err) {
        console.log(err)
      }
      Users
        .find({ type: 'TRANS' })
        .populate({ path: 'entityID', model: 'Transporter' })
        .exec((err, usersTrans) => {
          if (err) {
            console.log(err)
          }
          var users = usersMatrix.concat(usersTrans)
          Users.populate(users, { path: 'entityID.dataEntity', model: 'DataEntity' }, (_err, users) => {
            if (_err) {

            }
            console.log(users)
            return res.status(200).send(users)
          })
        })
    })
}

exports.patchUser = (req, res) => {
  Users.findOneAndUpdate({ _id: req.body.userID }, req.body)
    .exec((err, user) => {
      if (err) {
        console.log(err)
      }
      return res.status(200).send(user)
    })
}

exports.deleteUser = (req, res) => {
  Users.deleteOne({ _id: req.body.userID }, (err, user) => {
    if (err) {
      console.log(err)
    }
    return res.status(200).send(user)
  })
}
