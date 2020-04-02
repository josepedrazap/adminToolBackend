const mongoose = require("mongoose");

const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    localID: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Local"
    },
    datetimeInit: {
      type: Date,
      default: null
    },
    datetimeFinish: {
      type: Date,
      default: null
    },
    datetimeCreated: {
      type: Date,
      default: Date.now()
    },
    materials: [
      {
        materialID: {
          type: String
        },
        quantity: {
          type: Number
        },
        prev: {
          type: Number
        }
      }
    ],
    url: {
      type: String,
      default: ""
    },
    month: {
      type: String,
      default: ""
    }
  },
  {
    minimize: false
  }
);

// Export model
module.exports = mongoose.model("Report", reportSchema);
