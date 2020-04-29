const service = require("../services/index");

const isAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).send({
      error: "NOT_AUTHORIZED",
    });
  }
  const token = req.headers.authorization;
  service
    .decodeToken(token)
    .then((response) => {
      if (response.activate === 1) {
        req.userID = response.userID;
        req.userType = response.userType;
        req.entityID = response.entityID;
        req.tokenID = response.tokenID;
        next();
      } else {
        res.status(418).send({
          error: "USER_NOT_ACTIVATED",
        });
      }
    })
    .catch((response) => {
      res.status(response.status).send({
        error: response.message,
      });
    });
};
module.exports = isAuth;
