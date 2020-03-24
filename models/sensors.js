const mongoose = require('mongoose')

const { Schema } = mongoose

const sensorsSchema = new Schema(
  {
    model: {
      type: Number,
      default: null
    },
    localID: {
      type: Schema.Types.ObjectId,
      default: null
    },
    imei: [{
      type: Date,
      default: Date.now()
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
module.exports = mongoose.model('Sensors', sensorsSchema)
