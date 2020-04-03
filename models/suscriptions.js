const mongoose = require("mongoose");

const { Schema } = mongoose;

const suscriptionsSchema = new Schema(
  {
    name: {
      type: String,
      default: ""
    },
    value: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: ""
    },
    removals: {
      type: Number,
      default: 0
    },
    maxVolume: {
      type: Number,
      default: 0
    }
  },
  {
    minimize: false
  }
);

// Export model
module.exports = mongoose.model("Suscription", suscriptionsSchema);
