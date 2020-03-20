const ejs = require("ejs");
const fs = require("fs");

exports.exec = data => {
  const compiled = ejs.compile(
    fs.readFileSync("./templates/removalNotify/html.ejs", "utf8")
  );

  return {
    compiled: compiled({
      address: data.address,
      name: data.name,
      localName: data.localName,
      payment: data.payment,
      message: data.message,
      datetimeRemoval: data.datetimeRemoval,
      urlConfirmation: data.urlConfirmation,
      urlDenegation: data.urlDenegation
    }),
    subject: "Nuevo retiro disponible!",
    to: [data.to]
  };
};
