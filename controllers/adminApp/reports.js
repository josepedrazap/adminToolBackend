const Removals = require("../../models/removals");
const Locals = require("../../models/locals");
const Reports = require("../../models/reports");
const ecoData = require("../../files/ecoData.json");
// const pdf = require('html-pdf')
const fs = require("fs");
const ejs = require("ejs");
const uploadFile = require("../../services/uploadFile");

// const createPDF = (data) => {
//   return new Promise((resolve, reject) => {
//     var compiled = ejs.compile(
//       fs.readFileSync('./views/pdf.ejs', 'utf8')
//     )
//     const ret = compiled({
//       ...data
//     })
//     pdf
//       .create(ret.toString())
//       .toFile('./temp/reports/' + data.ID + '.pdf', (err, pdf) => {
//         if (err) {
//           reject(err)
//         } else {
//           resolve(pdf.filename)
//         }
//       })
//   })
// }

exports.retriveReports = (req, res) => {
  Reports.find()
    .populate("localID")
    .exec((err, reports) => {
      if (err) {
        return res.status(400).send();
      }
      return res.status(200).send(reports);
    });
};

exports.getDataCreateReports = async (req, res) => {
  const locals = await Locals.find();
  return res.status(200).send({ locals });
};

exports.loadDataCreateReport = async (req, res) => {
  const localID = req.query.localID;

  if (localID === null) {
    return res.status(200).send([]);
  } else {
    //   const local = await Locals.findOne({ _id: localID })

    const removals = await Removals.find({
      localID,
      datetimeRemoval: {
        $lt: new Date(req.query.datetimeFinish.replace(/['"]+/g, "")),
        $gt: new Date(req.query.datetimeInit.replace(/['"]+/g, ""))
      },
      status: { $ne: "DELETED" }
    });

    // const reports = await Reports.find({ localID })

    var data = [
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

    removals.forEach(element => {
      element.materials.forEach(material => {
        for (let i = 0; i < data.length; i++) {
          if (data[i].material === material.material) {
            data[i].quantity += material.quantity;
          }
        }
      });
    });
    return res.status(200).send({ data, removals });
  }
};

exports.createReport = async (req, res) => {
  const localID = req.body.localID;

  if (localID === null) {
    return res.status(300).send([]);
  }

  const local = await Locals.findOne({ _id: localID });
  const datetimeFinish = new Date(
    req.body.datetimeFinish.replace(/['"]+/g, "")
  );
  const datetimeInit = new Date(req.body.datetimeInit.replace(/['"]+/g, ""));

  let monthTemp = datetimeInit.getMonth();
  let yearTemp = datetimeInit.getFullYear();

  monthTemp = monthTemp - 1;
  if (monthTemp < 0) {
    yearTemp = yearTemp - 1;
    monthTemp = 11;
  }

  const datetimeInitPrev = new Date(yearTemp, monthTemp, 1);
  const datetimeFinishPrev = new Date(yearTemp, monthTemp + 1, 0, 23, 59, 59);

  const removalsActual = await Removals.find({
    localID,
    datetimeRemoval: {
      $lt: datetimeFinish,
      $gt: datetimeInit
    },
    status: { $ne: "DELETED" }
  });
  const removalsPrev = await Removals.find({
    localID,
    datetimeRemoval: {
      $lt: datetimeFinishPrev,
      $gt: datetimeInitPrev
    },
    status: { $ne: "DELETED" }
  });
  const removalsHistoric = await Removals.find({
    localID,
    datetimeRemoval: {
      $lt: datetimeInit
    },
    status: { $ne: "DELETED" }
  });

  const year = datetimeInit.getFullYear();
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
  ];
  var month = "";
  if (datetimeInit.getMonth() === datetimeFinish.getMonth()) {
    month = months[datetimeInit.getMonth()];
  } else {
    month =
      months[datetimeInit.getMonth()] +
      " ~ " +
      months[datetimeFinish.getMonth()];
  }
  const company = local.name;
  var data = [
    { materialID: "CEL", name: "Celulosa", quantity: 0, prev: 0, x: 0 },
    { materialID: "PLASTIC", name: "Plástico", quantity: 0, prev: 0, x: 0 },
    { materialID: "GLASS", name: "Vidrio", quantity: 0, prev: 0, x: 0 },
    { materialID: "ALUMINIUM", name: "Aluminio", quantity: 0, prev: 0, x: 0 },
    { materialID: "METALS", name: "Otros metales", quantity: 0, prev: 0, x: 0 },
    { materialID: "TETRAPAK", name: "tetrapak", quantity: 0, prev: 0, x: 0 },
    { materialID: "ORGANICS", name: "Orgánicos", quantity: 0, prev: 0, x: 0 },
    {
      materialID: "ELECTRONICS",
      name: "Electrónicos",
      quantity: 0,
      prev: 0,
      x: 0
    },
    { materialID: "TEXTILS", name: "Textiles", quantity: 0, prev: 0, x: 0 }
  ];

  removalsActual.forEach(element => {
    element.materials.forEach(material => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].materialID === material.material) {
          data[i].quantity += material.quantity * 1;
        }
      }
    });
  });
  removalsPrev.forEach(element => {
    element.materials.forEach(material => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].materialID === material.material) {
          data[i].prev += material.quantity * 1;
        }
      }
    });
  });
  removalsHistoric.forEach(element => {
    element.materials.forEach(material => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].materialID === material.material) {
          data[i].x += (material.quantity * 1) / removalsHistoric.length;
        }
      }
    });
  });

  var payload = [];
  var totalKilos = 0;

  var total = [
    { ID: "TREE", q: 0, unity: "Un" },
    { ID: "WATER", q: 0, unity: "L" },
    { ID: "PETROL", q: 0, unity: "L" },
    { ID: "ENERGY", q: 0, unity: "kWatt" },
    { ID: "CO2", q: 0, unity: "Kg" }
  ];

  data.map(element => {
    let temp = ecoData.filter(
      material => material.materialID === element.materialID
    )[0];
    payload.push({
      material: temp.materialID,
      name: temp.name,
      prev: element.prev,
      x: element.x,
      v: !!parseInt(element.quantity),
      quantity: element.quantity,
      color: temp.color,
      data: temp.savesPerKilogram.map(spk => {
        return {
          name: spk.name,
          quantity:
            Math.round(spk.quantity * element.quantity) + " " + spk.unity,
          q: Math.round(spk.quantity * element.quantity),
          ID: spk.ID,
          unity: spk.unity
        };
      })
    });
  });
  payload
    .filter(element => element.v)
    .forEach(data => {
      data.data.forEach(element => {
        total.forEach((el, i) => {
          if (el.ID === element.ID) {
            total[i].q += element.q;
          }
        });
      });
    });
  var dataActual = "";
  var colors = "";
  var dataPrev = "";
  var dataMedia = "";
  var labels = "";
  var metadata = [];

  payload.forEach((element, i) => {
    labels += '"' + element.name + '",';
    dataActual += Math.round(element.quantity) + ",";
    colors += '"' + element.color + '",';
    dataPrev += Math.round(element.prev) + ",";
    dataMedia += Math.round(element.x) + ",";
    totalKilos += Math.round(element.quantity);
  });

  total.forEach(element => {
    if (element.ID === "PETROL") {
      metadata.push(
        "Con el petróleo ahorrado un vehículo puede andar " +
          Math.round(element.q * 6.8 * 100) / 100 +
          "Km (a 6.8 Km/L)"
      );
    }
    if (element.ID === "ENERGY") {
      metadata.push(
        "Con la energía ahorrada una casa puede funcionar " +
          Math.round((element.q / 22.47) * 100) / 100 +
          " días (a 22.47 kWatt/día)"
      );
    }
  });

  const outlabeledPie =
    "https://quickchart.io/chart?width=280&height=240&c={type:'doughnut',data:{labels:[" +
    labels.substr(0, labels.length - 1) +
    "], datasets:[{label:'Materiales',data:[" +
    dataActual.substr(0, dataActual.length - 1) +
    "], backgroundColor:[" +
    colors.substr(0, colors.length - 1) +
    "]}]}, options: {legend: {labels: {fontSize: 9, boxWidth: 10}}}}";

  const acumulated =
    "https://quickchart.io/chart?width=280&height=240&c={type:'bar',data:{labels:[" +
    labels.substr(0, labels.length - 1) +
    "], datasets:[{label:'Actual',data:[" +
    dataActual.substr(0, dataActual.length - 1) +
    "],backgroundColor: 'CORNFLOWERBLUE'},{label:'Anterior',data:[" +
    dataPrev.substr(0, dataPrev.length - 1) +
    "],backgroundColor: 'lightgreen'},{type:'line',fill:false, label:'Promedio histórico',data:[" +
    dataMedia.substr(0, dataMedia.length - 1) +
    '], backgroundColor: "KHAKI", borderColor: "KHAKI"}]}, options: {scales: {yAxes: [{ ticks: {fontSize: 9, stretch: 35}}], xAxes: [{ ticks: {fontSize: 9, stretch: 35}}]}, legend: {labels: {color: "black", fontSize: 9, stretch: 35}}}}';

  const report = await Reports.create({
    materials: data,
    localID,
    datetimeInit,
    datetimeFinish,
    month
  });

  const qrtext =
    "https://s3.amazonaws.com/accioncircular.com/reports/" +
    localID +
    "_" +
    report._id +
    ".pdf";
  const qr =
    "https://quickchart.io/qr?text=" +
    qrtext +
    "&dark=457595&light=fff&ecLevel=Q&format=png";

  return res.status(200).send();

  // createPDF({ ID: localID + '_' + report._id, payload: payload.filter(element => element.v), total, year, month, company, totalKilos, qr, data, outlabeledPie, metadata, acumulated })
  //   .then(response => {
  //     uploadFile.upload({
  //       pdf: response,
  //       path: 'reports',
  //       ID: localID + '_' + report._id
  //     }).then(async (url) => {
  //       await Reports.findOneAndUpdate({ _id: report._id }, { url })
  //       fs.unlink(response, (_err, _data) => {
  //         return res.status(200).send(url)
  //       })
  //     }).catch(err => {
  //       return res.status(400).send(err)
  //     })
  //   }).catch(err => {
  //     return res.status(400).send(err)
  //   })
};
