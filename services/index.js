const jwt = require('jwt-simple')
const moment = require('moment')
const mongoose = require('mongoose')
const WorkingToken = require('../models/workingTokens')

const LIMIT_OF_SESSIONS_PER_USER = 40
const MAX_TIME_PER_SESSION_HRS = 12

exports.createToken = user => {
  const decoded = new Promise((resolve, reject) => {
    try {
      WorkingToken.find({
        userID: user._id
      }).exec((_err, wts) => {
        let cont = 0
        if (wts) {
          for (let i = 0; i < wts.length; i++) {
            if (wts[i].exp <= moment().unix()) {
              cont++
              WorkingToken.deleteOne({
                _id: wts[i]._id
              })
            }
          }
        }
        if (wts.length - cont > LIMIT_OF_SESSIONS_PER_USER) {
          reject({
            error: 'LIMIT_OF_SESSIONS_PER_USER'
          })
        } else {
          WorkingToken.create(
            {
              userID: user._id,
              iat: moment().unix(),
              exp: moment()
                .add(MAX_TIME_PER_SESSION_HRS, 'h')
                .unix(),
              userType: user.type,
              entityID: user.entityID,
              activate: user.activate
            },
            (err, wt) => {
              if (err) throw err
              const payload = {
                tokenID: wt._id
              }
              resolve(jwt.encode(payload, process.env.SECRET_TOKEN))
            }
          )
        }
      })
    } catch (err) {
      reject({
        error: 'ERROR_UNKNOW'
      })
    }
  })
  return decoded
}
exports.decodeToken = token => {
  const decoded = new Promise((resolve, reject) => {
    try {
      const payload = jwt.decode(token, process.env.SECRET_TOKEN)
      if (!mongoose.Types.ObjectId.isValid(payload.tokenID)) {
        reject({
          status: 500,
          message: 'INVALID_TOKEN'
        })
      } else {
        WorkingToken.findOne({
          _id: payload.tokenID
        }).exec((err, wt) => {
          if (err) throw err
          if (wt) {
            if (wt.exp <= moment().unix()) {
              WorkingToken.deleteOne({
                _id: wt._id
              })
              reject({
                status: 401,
                message: 'EXPIRED_TOKEN'
              })
            } else {
              resolve(wt)
            }
          } else {
            reject({
              status: 401,
              message: 'ELIMINATED_TOKEN'
            })
          }
        })
      }
    } catch (err) {
      reject({
        status: 400,
        message: 'INVALID_TOKEN'
      })
    }
  })
  return decoded
}
