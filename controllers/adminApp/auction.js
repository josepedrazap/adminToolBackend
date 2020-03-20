const AuctionRequests = require("../../models/auctionRequests");
const Removals = require("../../models/removals");

const materials = [
  { material: "CEL", quantity: 0 },
  { material: "PLASTIC", quantity: 0 },
  { material: "GLASS", quantity: 0 },
  { material: "ALUMINIUM", quantity: 0 },
  { material: "METALS", quantity: 0 },
  { material: "TETRAPAK", quantity: 0 },
  { material: "ORGANICS", quantity: 0 },
  { material: "ELECTRONICS", quantity: 0 },
  { material: "TEXTILS", quantity: 0 }
];

exports.craeteRequest = async (req, res) => {
  const data = req.body;

  // Corroborar data
  // return res.status(200).send();
  var removal = await Removals.create({
    ...data.removal,
    materials,
    status: "IN_AUCTION"
  });

  if (removal) {
    var intervalTime = parseInt(data.auction.intervalTime) * 60 * 1000;

    var now = Date.now();

    // now = now + 5 * 60 * 1000;
    var transporters = await data.auction.transporters.map((transporter, i) => {
      return {
        transporterID: transporter._id,
        removalID: removal._id,
        localID: removal.localID,
        message: data.auction.message,
        datetimePublish: new Date(now + intervalTime * i),
        localName: data.auction.localName
      };
    });

    var auctionRequests = await AuctionRequests.create(transporters);

    if (auctionRequests) {
      return res.status(200).send(auctionRequests);
    } else {
      removal = await Removals.deleteOne({ _id: removal._id });
      return res.status(400).send();
    }
  } else {
    removal = await Removals.deleteOne({ _id: removal._id });
    return res.status(412).send();
  }
};

exports.confirm = async (req, res) => {
  var requestID = req.query.q;
  var resp = req.query.r;

  if (String(resp) === "0") {
    let request = await AuctionRequests.findOneAndUpdate(
      { _id: requestID },
      { status: "DENEGATED" }
    );
    if (request) {
      return res.status(200).send("DENEGATED");
    } else {
      return res.status(400).send();
    }
  } else {
    const request = await AuctionRequests.findOne({ _id: requestID });

    if (request) {
      const removal = await Removals.findOneAndUpdate(
        { _id: request.removalID, transporterID: null },
        { transporterID: request.transporterID, status: "COMPLETE" },
        { new: true }
      );
      if (removal) {
        return res.status(200).send("TAKEN");
      } else {
        return res.status(412).send(":(");
      }
    } else {
      return res.status(404).send();
    }
  }
};
