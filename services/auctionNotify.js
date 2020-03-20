const Scheduled = require("scheduled");
const AuctionRequests = require("../models/auctionRequests");
const Mailer = require("../services/mailer");

exports.exec = io => {
  new Scheduled({
    pattern: "*/1", // Tarea a ejecutar cada un minuto
    task() {
      console.log("enviando notificaciones");
      AuctionRequests.find({
        datetimePublish: { $lt: Date.now() },
        status: "NOT_SENT"
      })
        .populate("removalID")
        .populate("localID")
        .populate("transporterID")
        .exec((_err, auctionRequests) => {
          if (auctionRequests) {
            auctionRequests.forEach(request => {
              Mailer.sendEmail({
                type: "REMOVAL_NOTIFY",
                name:
                  request.transporterID.name +
                  " " +
                  request.transporterID.lastName,
                localName: request.localName,
                address:
                  request.localID.address + ", " + request.localID.commune,
                to: request.transporterID.email,
                payment: request.removalID.payment,
                message: request.message,
                datetimeRemoval: request.datetimeRemoval,
                urlConfirmation:
                  "http://192.168.0.15:3000/adminTool/auction/confirm?q=" +
                  request._id +
                  "&r=1",
                urlDenegation:
                  "http://192.168.0.15:3000/adminTool/auction/confirm?q=" +
                  request._id +
                  "&r=0"
              });
              request.status = "SENT";
              request.save();
            });
          }
        });
    }
  }).start();
};
