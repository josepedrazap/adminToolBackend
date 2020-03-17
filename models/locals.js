const mongoose = require("mongoose");

const { Schema } = mongoose;

const localSchema = new Schema(
  {
    name: {
      type: String,
      default: ""
    },
    customerID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Customer"
    },
    phone: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      default: ""
    },
    contactName: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    suscription: {
      type: Number,
      default: 1.5
    },
    commune: {
      type: String,
      default: ""
    },
    day: {
      type: Number,
      default: 0
    },
    removals: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      default: "READY",
      enum: ["READY", "DELETED"]
    }
  },
  {
    minimize: false
  }
);

// Export model
module.exports = mongoose.model("Local", localSchema);
