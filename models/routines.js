const mongoose = require('mongoose')

const { Schema } = mongoose

const routineSchema = new Schema(
  {
    removalsQuantity: {
      type: Number,
      default: null
    },
    localID: {
      type: Schema.Types.ObjectId,
      default: null
    },
    datesRemovals: [{
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
module.exports = mongoose.model('Routine', routineSchema)
