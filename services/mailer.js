const aws = require("aws-sdk");
require("dotenv").config();

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "us-east-1"
});

const ses = new aws.SES({
  apiVersion: process.env.AWS_SES_API_VERSION
});

const templatesEmails = data => {
  switch (data.type) {
    case "REMOVAL_NOTIFY":
      return require("../templates/removalNotify/config").exec(data);
    default:
      return [];
  }
};

exports.sendEmail = data => {
  return new Promise((resolve, reject) => {
    var payload = templatesEmails(data);
    ses.sendEmail(
      {
        Source: process.env.AWS_EMAIL_FROM,
        Destination: {
          ToAddresses: payload.to
        },
        Message: {
          Subject: {
            Data: payload.subject
          },
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: payload.compiled
            }
          }
        }
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
};
