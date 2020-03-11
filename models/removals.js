const mongoose = require('mongoose')

const { Schema } = mongoose

const removalSchema = new Schema(
  {
    localID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: 'Local'
    },
    transporterID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: 'Transporter'
    },
    lastModificationID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: 'User'
    },
    datetimeLastModification: {
      type: Date,
      default: Date.now()
    },
    datetimeRequest: {
      type: Date,
      default: null
    },
    datetimeRemoval: {
      type: Date,
      default: null
    },
    payment: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: 'PENDING_TRANS',
      enum: ['PENDING_TRANS', 'PENDING_PAYMENT', 'COMPLETE', "DELETED"]
    },
    urlReport: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: ''
    },
    materials: [{
      material: {
        type: String
      },
      quantity: {
        type: Number
      }
    }]
  },
  {
    minimize: false
  }
)

// Export model
module.exports = mongoose.model('Removal', removalSchema)
