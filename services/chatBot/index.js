const { Wit } = require("node-wit");
const removals = require("./removals");

const client = new Wit({
  accessToken: process.env.WIT_ACCESS_TOKEN,
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

exports.chatAnswer = async ({ text, entityID, type, socket }) => {
  const data = await client.message(text);
  var response = "Disculpa, no entiendo lo que necesitas";

  const getGreetings = firstEntityValue(data.entities, "getGreetings");
  const getRemovals = firstEntityValue(data.entities, "getRemovals");
  const getReports = firstEntityValue(data.entities, "getReports");
  const getEcoeq = firstEntityValue(data.entities, "getEcoeq");
  const setSession = firstEntityValue(data.entities, "setSession");
  const setRemoval = firstEntityValue(data.entities, "setRemoval");
  const datetime = firstEntityValue(data.entities, "datetime");

  if (setSession) {
    if (setSession === "LOGOUT") {
      socket.emit("newAction_" + entityID, {
        action: "LOGOUT",
      });
    }
    return "Hasta luego";
  }

  if (setRemoval) {
    const resp = await removals.setRemovalFunction({
      setRemoval,
      datetime,
      entityID,
      type,
    });
    if (resp.action !== "EMPTY") {
      socket.emit("newAction_" + entityID, {
        action: resp.action,
      });
    }
    return resp.response;
  }

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
