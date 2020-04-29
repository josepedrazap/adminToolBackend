const mongoose = require("mongoose");

const { Schema } = mongoose;

const customerSchema = new Schema(
  {
    brand: {
      type: String,
      default: "",
    },
    rut: {
      type: String,
      default: "",
    },
    commune: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    localsID: [
      {
        type: Schema.Types.ObjectId,
        default: null,
        ref: "Local",
      },
    ],
    datetimeCreated: {
      type: Date,
      default: Date.now(),
    },
    status: {
      type: String,
      default: "READY",
      enum: ["READY", "DELETED"],
    },
    users: {
      type: Array,
      default: [],
    },
    urlLogo: {
      type: String,
      default: "",
    },
  },
  {
    minimize: false,
  }
);

// Export model
module.exports = mongoose.model("Customer", customerSchema);
