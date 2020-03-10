const mongoose = require('mongoose')

const { Schema } = mongoose

const workingTokensSchema = new Schema({
  userID: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userType: {
    type: String,
    default: null
  },
  entityID: {
    type: Schema.Types.ObjectId,
    ref: 'Entity',
    default: null
  },
  activate: {
    type: Number,
    default: null
  },
  iat: {
    type: Number,
    default: null
  },
  exp: {
    type: Number,
    default: null
  }
})
// Export model
module.exports = mongoose.model('WorkingTokens', workingTokensSchema)
