const AWS = require('aws-sdk')
const Validator = require('jsonschema').Validator
require('dotenv').config()

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})
const s3 = new AWS.S3()

const validateData = data => {
  const v = new Validator()
  const schema = {
    type: 'object',
    required: ['image', 'id', 'path'],
    properties: {
      image: {
        type: 'array',
        items: {
          type: 'string',
          examples: ['data:image/png;base64,']
        }
      },
      id: {
        type: 'string',
        examples: ['5d13bde22c76e24cd46f74c6']
      },
      path: {
        type: 'string',
        examples: ['images']
      }
    }
  }
  console.log(v.validate(data, schema).errors)
  return v.validate(data, schema).errors.length
}
const getExtension = (img) => {
  const pos = img.indexOf(';', 11)
  var ext = img.substring(11, pos)
  return ext
}
exports.index = (data) => {
  return new Promise((resolve, reject) => {
    if (validateData(data)) {
      reject(new Error('ERROR_UNR_5'))
    }
    var img = data.image.toString()
    const ext = getExtension(img)
    img = img.replace('data:image/' + ext + ';base64,', '')
    const decodedImage = new Buffer.from(img, 'base64')
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: decodedImage,
      Key: `${data.path}/${data.id}.${ext}`
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
