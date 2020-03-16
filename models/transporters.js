const mongoose = require("mongoose");

const { Schema } = mongoose;

const transporterSchema = new Schema(
  {
    name: {
      type: String,
      default: ""
    },
    lastName: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      default: ""
    },
    company: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    commune: {
      type: String,
      default: ""
    },
    certification: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      default: "READY"
    }
  },
  {
    minimize: false
  }
);

// Export model
module.exports = mongoose.model("Transporter", transporterSchema);
