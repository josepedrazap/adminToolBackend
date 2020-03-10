const aws = require('aws-sdk')
require('dotenv').config()

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
})

const ses = new aws.SES({
  apiVersion: process.env.AWS_SES_API_VERSION
})

const templatesEmails = data => {
  switch (data.type) {
    case 'NEW_USER_TOKEN':
      return require('../templates/newUserToken/config').exec(data)

    case 'NEW_USER_LOCAL':
      return require('../templates/newUserLocal/config').exec(data)

    case 'NOTIFY_NEW_REQUEST':
      return require('../templates/transNotifyDaemon/config').exec(data)

    case 'EMAIL_LANDINGPAGE':
      return require('../templates/emailLandingpage/config').exec(data)

    case 'NEW_USER_PASS':
      return require('../templates/newPassword/config').exec(data)

    case 'RECOVERY_PASS':
      return require('../templates/recoveryPass/config').exec(data)

    default:
      return []
  }
}

exports.send_email = data => {
  try {
    ses.sendEmail({
      Source: process.env.AWS_EMAIL_FROM,
      Destination: {
        ToAddresses: [data.to]
      },
      Message: {
        Subject: {
          Data: data.subject
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: templatesEmails(data)
          }
        }
      }
    }, (err, data) => {
      console.log(err)
      return data
    })
  } catch (_err) {
    console.log(_err)
    return false
  }
}
