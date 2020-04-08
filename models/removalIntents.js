const mongoose = require("mongoose");

const { Schema } = mongoose;

const removalIntentSchema = new Schema(
  {
    localID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Local"
    },
    author: {
      type: String,
      enum: ["ADMIN", "WEBAPP", "SENSOR"]
    },
    datetimeRequest: {
      type: Date,
      default: Date.now()
    },
    datetimeRemoval: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      default: "PENDING_APROVE_USER",
      enum: ["PENDING_APROVE_USER", "PENDING_APROVE_ADMIN"]
    }
  },
  {
    minimize: false
  }
);

// Export model
module.exports = mongoose.model("RemovalIntent", removalIntentSchema);
