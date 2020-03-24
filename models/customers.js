const mongoose = require("mongoose");

const { Schema } = mongoose;

const customerSchema = new Schema(
  {
    brand: {
      type: String,
      default: ""
    },
    rut: {
      type: String,
      default: ""
    },
    contactName: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    localsID: [
      {
        type: Schema.Types.ObjectId,
        default: null,
        ref: "Local"
      }
    ],
    datetimeCreated: {
      type: Date,
      default: Date.now()
    },
    status: {
      type: String,
      default: "READY",
      enum: ["READY", "DELETED"]
    },
    users: {
      type: Array,
      default: []
    }
  },
  {
    minimize: false
  }
);

// Export model
module.exports = mongoose.model("Customer", customerSchema);
