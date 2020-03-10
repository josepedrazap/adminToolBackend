const mongoose = require('mongoose')

const { Schema } = mongoose

const localSchema = new Schema(
  {
    name: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    contactName: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    suscription: {
      type: Number,
      default: 1.5
    },
    commune: {
      type: String,
      default: ''
    }
  },
  {
    minimize: false
  }
)

// Export model
module.exports = mongoose.model('Local', localSchema)
