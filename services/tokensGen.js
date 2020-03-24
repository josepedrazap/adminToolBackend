const jwt = require("jwt-simple");

exports.createToken = payload => {
  return new Promise((resolve, reject) => {
    resolve(jwt.encode(payload, process.env.ACTIVATE_TOKEN));
  });
};
exports.decodeToken = token => {
  return new Promise((resolve, reject) => {
    resolve(jwt.decode(token, process.env.ACTIVATE_TOKEN));
  });
};
