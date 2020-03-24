const ejs = require("ejs");
const fs = require("fs");

exports.exec = data => {
  const compiled = ejs.compile(
    fs.readFileSync("./templates/newUserVerify/html.ejs", "utf8")
  );
  let aux = "";
  if (data.user.type === "CUSTOMER") {
    aux = "cliente";
  }
  if (data.user.type === "LOCAL") {
    aux = "local";
  }

  return {
    compiled: compiled({
      url: data.url,
      userType: aux,
      email: data.email
    }),
    subject: "Activación de usuario",
    to: [data.to]
  };
};
