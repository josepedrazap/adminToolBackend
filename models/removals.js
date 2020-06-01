const mongoose = require("mongoose");

const { Schema } = mongoose;

const removalSchema = new Schema(
  {
    localID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Local",
    },
    author: {
      type: String,
      enum: ["ADMIN", "WEBAPP_SUSCRIPTION", "WEBAPP_EXTRA", "SENSOR"],
    },
    transporterID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Transporter",
    },
    lastModificationID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "User",
    },
    datetimeLastModification: {
      type: Date,
      default: Date.now(),
    },
    datetimeRequest: {
      type: Date,
      default: Date.now(),
    },
    datetimeRemoval: {
      type: Date,
      default: null,
    },
    datetimeUser: {
      type: Date,
      default: null,
    },
    payment: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "PENDING_TRANS",
      enum: [
        "PENDING_TRANS",
        "PENDING_PAYMENT",
        "COMPLETE",
        "DELETED",
        "IN_AUCTION",
      ],
    },
    urlReport: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    urlImage: {
      type: String,
      default: "",
    },
    intent: {
      type: String,
      default: "EMPTY",
    },
    materials: [
      {
        material: String,
        quantity: Number,
      },
    ],
    timeWindow: {
      type: String,
      default: "A",
    },
  },
  {
    minimize: false,
  }
);

// Export model
module.exports = mongoose.model("Removal", removalSchema);
