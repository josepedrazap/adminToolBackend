const mongoose = require("mongoose");
const { clean } = require("rut.js");
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
    businessName: {
      type: String,
      default: "",
    },
    businessActivity: {
      type: String,
      default: "",
    },
    addressSociety: {
      type: String,
      default: "",
    },
    legalRepresentName: {
      type: String,
      default: "",
    },
    legalRepresentRut: {
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

customerSchema.pre("save", function (next) {
  this.rut = clean(this.rut);
  next();
});

// Export model
module.exports = mongoose.model("Customer", customerSchema);
