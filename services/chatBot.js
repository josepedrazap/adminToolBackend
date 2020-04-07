const { Wit } = require("node-wit");

const client = new Wit({
  accessToken: process.env.WIT_ACCESS_TOKEN
});

const firstEntityValue = (entities, entity) => {
  const val =
    entities &&
    entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value;

  if (!val) {
    return null;
  }

  return val;
};

exports.chatAnswer = async text => {
  const data = await client.message(text);

  const getGreetings = firstEntityValue(data.entities, "getGreetings");
  const getRemovals = firstEntityValue(data.entities, "getRemovals");
  const getReports = firstEntityValue(data.entities, "getReports");
  const getEcoeq = firstEntityValue(data.entities, "getEcoeq");

  var response = "Disculpa, no entiendo lo que necesitas";

  if (getGreetings) {
    response =
      data.entities.getGreetings[
        Math.floor(Math.random() * data.entities.getGreetings.length)
      ].value;
  }

  if (getRemovals) {
    response =
      data.entities.getRemovals[
        Math.floor(Math.random() * data.entities.getRemovals.length)
      ].value;
  }

  if (getReports) {
    response =
      data.entities.getReports[
        Math.floor(Math.random() * data.entities.getReports.length)
      ].value;
  }

  if (getEcoeq) {
    response =
      data.entities.getEcoeq[
        Math.floor(Math.random() * data.entities.getEcoeq.length)
      ].value;
  }

  return response;
};
