const service = require("../services/index");

function isAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).send({
      error: "NOT_AUTHORIZED",
    });
  }
  const token = req.headers.authorization;
  service
    .decodeToken(token)
    .then((response) => {
      if (response.userType === "ADMIN") {
        req.userID = response.userID;
        req.userType = response.userType;
        req.entityID = response.entityID;
        req.tokenID = response.tokenID;
        next();
      } else {
        res.status(403).send({
          error: "NOT_CREDENTIALS",
        });
      }
    })
    .catch((response) => {
      res.status(response.status).send({
        error: response.message,
      });
    });
}
module.exports = isAuth;
