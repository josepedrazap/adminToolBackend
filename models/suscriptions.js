const mongoose = require('mongoose')

const { Schema } = mongoose

const suscriptionSchema = new Schema(
  {
    value: {
      type: Number,
      default: ''
    },
    name: {
      type: String,
      default: ''
    },
    routines: [{
      type: Schema.Types.ObjectId,
      default: null
    }],
    datetimeCreated: {
      type: Date,
      default: Date.now()
    }
  },
  {
    minimize: false
  }
)

// Export model
module.exports = mongoose.model('Suscription', suscriptionSchema)
