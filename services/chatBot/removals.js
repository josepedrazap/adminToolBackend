const Removals = require("../../models/removals");
const RemovalIntents = require("../../models/removalIntents");
const Locals = require("../../models/locals");
const days = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sabado",
];

const months = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const ifRemovalsAvailables = async (entityID, date) => {
  const local = await Locals.findOne({ _id: entityID }).populate(
    "suscriptionID"
  );
  const removals = await Removals.find({
    localID: entityID,
    status: { $in: ["PENDING_TRANS", "PENDING_VALOR", "COMPLETE"] },
    datetimeRemoval: {
      $gt: new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 1),
      $lte: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
    },
  });
  if (local.suscriptionID) {
    if (local.suscriptionID.removals > removals.length) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};
const materials = [
  { material: "CEL", quantity: 0 },
  { material: "PLASTIC", quantity: 0 },
  { material: "GLASS", quantity: 0 },
  { material: "ALUMINIUM", quantity: 0 },
  { material: "METALS", quantity: 0 },
  { material: "TETRAPAK", quantity: 0 },
  { material: "ORGANICS", quantity: 0 },
  { material: "ELECTRONICS", quantity: 0 },
  { material: "TEXTILS", quantity: 0 },
];

exports.setRemovalFunction = async ({
  setRemoval,
  datetime,
  entityID,
  type,
}) => {
  var response = "";
  var action = "EMPTY";
  if (type === "LOCAL") {
    const date = new Date(datetime);
    const now = new Date();

    if (setRemoval === "CREATE_REMOVAL") {
      if (date.getHours() > 6 && date.getHours() < 10) {
        response =
          "Lo siento, nuestro horario de trabajo es de lunes a viernes de 10:00 a 18:00 Hrs";
      } else {
        if (date.getDay() === 0 || date.getDay() === 6) {
          response =
            "Lo siento, nuestro horario de trabajo es de lunes a viernes de 10:00 a 18:00 Hrs";
        } else if ((date - now) / 3600000 < 48) {
          console.log(date);
          response =
            "Lo siento, el retiro debe ser programado con al menos dos días de anticipación";
        } else if ((date - now) / 3600000 > 336) {
          response =
            "Lo siento, el retiro debe ser programado para máximo dos semanas más";
        } else {
          if (!(await ifRemovalsAvailables(entityID, date))) {
            return {
              response:
                "No te quedan retiros disponibles en " +
                months[date.getMonth()] +
                ". Para pedir un retiro extra debes dirigirte a las pestaña de retiros y hacer click sobre el botón de la esquina superior derecha y rellenar los datos pedidos.",
              action: "REDIRECT_TO_REMOVALS",
            };
          }
          const intent = await RemovalIntents.create({
            author: "WEBAPP",
            datetimeRemoval: date,
            localID: entityID,
          });

          var hour =
            date.getHours() < 6 ? date.getHours() + 12 : date.getHours();
          var minutes =
            date.getMinutes() < 10
              ? "0" + date.getMinutes()
              : date.getMinutes();
          response =
            "Entendido. Para confirmar el retiro para el " +
            days[date.getDay()] +
            " " +
            date.getDate() +
            " de " +
            months[date.getMonth()] +
            " a las " +
            hour +
            ":" +
            minutes +
            " Hrs, por favor escribe 'confirmo el retiro', para descartarlo escribe 'descartar retiro'";
        }
      }
    }
    if (setRemoval === "CONFIRM_REMOVAL") {
      var intent = await RemovalIntents.findOneAndUpdate(
        {
          localID: entityID,
          status: "PENDING_APROVE_USER",
        },
        { status: "PENDING_APROVE_ADMIN" }
      );

      if (intent) {
        var del = await RemovalIntents.deleteOne({
          _id: intent._id,
        });
        intent = await Removals.create({
          author: "WEBAPP",
          datetimeRemoval: intent.datetimeRemoval,
          localID: entityID,
          notes: "Pedido mediante chat de IA",
          materials,
        });
        action = "REDIRECT_TO_REMOVALS";
        response = "Listo, retiro agendado";
      } else {
        response =
          "No has solicitado ningún retiro. Dime la hora y la fecha para agendarlo";
      }
    }
    if (setRemoval === "DISCARD_REMOVAL") {
      const intent = await RemovalIntents.deleteOne({
        localID: entityID,
        status: "PENDING_APROVE_USER",
      });
      if (intent.n) {
        response = "Retiro descartado";
      } else {
        response =
          "No has solicitado ningún retiro. Dime la hora y la fecha para agendarlo";
      }
    }
  } else {
    response = "Debes ser usuario de local para coordinar retiros por acá";
  }
  return { response, action };
};
