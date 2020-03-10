const AWS = require('aws-sdk')
require('dotenv').config()

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})
const s3 = new AWS.S3()

exports.index = (data) => {
  return new Promise((resolve, reject) => {
    const decodedPdf = new Buffer.from(data.pdf.toString().replace('data:application/pdf;base64,', ''), 'base64')
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: decodedPdf,
      Key: `removalsReports/${data.name}.pdf`
    }
    try {
      s3.upload(params, (err, data_) => {
        if (err) {
          reject(err)
        }
        if (data_) {
          resolve(data_.Location)
        } else {
          reject(new Error('ERROR_UNR_0'))
        }
      })
    } catch (e) {
      reject(new Error('ERROR_UNR_0'))
    }
  })
}
