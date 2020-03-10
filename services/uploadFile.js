const AWS = require('aws-sdk')
const fs = require('fs')

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})
const s3 = new AWS.S3()

exports.upload = data => {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(data.pdf)
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: fileContent,
      Key: `${data.path}/${data.ID}.pdf`
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
    } catch (err) {
      reject(err)
    }
  })
}
