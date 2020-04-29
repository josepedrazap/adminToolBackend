const mongoose = require("mongoose");

const { Schema } = mongoose;

const materialsSchema = new Schema(
  {
    CEL: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    PLASTIC: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    GLASS: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    ALUMINIUM: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    METALS: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    TETRAPAK: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    ORGANICS: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    ELECTRONICS: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
    TEXTILS: {
      quantity: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    minimize: false,
  }
);

// Export model
module.exports = mongoose.model("Materials", materialsSchema);
