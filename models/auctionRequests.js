const mongoose = require("mongoose");

const { Schema } = mongoose;

const auctionRequestSchema = new Schema(
  {
    datetimeCreate: {
      type: Date,
      default: Date.now()
    },
    datetimePublish: {
      type: Date
    },
    transporterID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Transporter"
    },
    localID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Local"
    },
    removalID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Removal"
    },
    message: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      default: "NOT_SENT"
    },
    localName: {
      type: String,
      default: ""
    }
  },
  {
    minimize: false
  }
);

// Export model
module.exports = mongoose.model("AuctionRequest", auctionRequestSchema);
