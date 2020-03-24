const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ["CUSTOMER", "TRANS", "ADMIN", "LOCAL"]
    },
    activate: {
      type: Number,
      default: 0
    },
    entityID: {
      type: Schema.Types.ObjectId,
      default: null
    },
    phone: {
      type: String,
      default: null
    },
    name: {
      type: String,
      default: null
    },
    lastName: {
      type: String,
      default: null
    },
    datetimeCreated: {
      type: Date,
      default: Date.now()
    },
    rut: {
      type: String,
      default: null
    }
  },
  {
    minimize: false
  }
);

// Export model
module.exports = mongoose.model("User", userSchema);
