const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const s3 = new AWS.S3();

exports.index = data => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${data.path}/${data.name}`
    };
    try {
      s3.deleteObject(params, (err, data) => {
        if (err) {
          reject(err);
        }
        if (data) {
          resolve(data);
        } else {
          reject(new Error("ERROR_UNR_0"));
        }
      });
    } catch (e) {
      reject(new Error("ERROR_UNR_0"));
    }
  });
};
