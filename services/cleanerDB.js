const Scheduled = require("scheduled");
const RemovalIntents = require("../models/removalIntents");
const ttl = 120000;

exports.exec = () => {
  new Scheduled({
    pattern: "*/1", // Tarea a ejecutar cada un minuto
    task() {
      const now = Date.now();
      console.log(new Date(now - ttl));
      RemovalIntents.deleteMany(
        {
          status: "PENDING_APROVE_USER",
          datetimeRequest: { $lt: new Date(now - ttl) },
        },
        (_err, intents) => {
          return;
        }
      );
    },
  }).start();
};
