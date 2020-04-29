const Removals = require("../../models/removals");
const Locals = require("../../models/locals");
const Reports = require("../../models/reports");
const ecoData = require("../../files/ecoData.json");
const puppeteer = require("puppeteer");
const fs = require("fs");
const ejs = require("ejs");
const uploadFile = require("../../services/uploadFile");
const deleteObjectS3 = require("../../services/deleteObjectS3");

exports.retriveReports = (req, res) => {
  Reports.find()
    .populate("localID")
    .exec((err, reports) => {
      if (err) {
        return res.status(400).send();
      }
      Locals.populate(
        reports,
        {
          path: "localID.customerID",
          model: "Customer",
        },
        (_err, reports) => {
          return res.status(200).send(reports);
        }
      );
    });
};

exports.getDataCreateReports = async (req, res) => {
  const locals = await Locals.find({ status: "READY" }).populate("customerID");

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
        $gt: new Date(req.query.datetimeInit.replace(/['"]+/g, "")),
      },
      status: { $ne: "DELETED" },
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
      { material: "TEXTILS", quantity: 0 },
    ];

    removals.forEach((element) => {
      element.materials.forEach((material) => {
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

  const local = await Locals.findOne({ _id: localID }).populate("customerID");
  const company = local.customerID.brand + " " + local.name;

  const datetimeFinish = new Date(
    req.body.datetimeFinish.replace(/['"]+/g, "")
  );
  const datetimeInit = new Date(req.body.datetimeInit.replace(/['"]+/g, ""));

  // Variables de desarrollo
  // const now = new Date();
  // const datetimeFinish = new Date();
  // const datetimeInit = new Date(now.getFullYear(), now.getMonth(), 0);

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
      $gt: datetimeInit,
    },
    status: { $ne: "DELETED" },
  });
  const removalsPrev = await Removals.find({
    localID,
    datetimeRemoval: {
      $lt: datetimeFinishPrev,
      $gt: datetimeInitPrev,
    },
    status: { $ne: "DELETED" },
  });
  const removalsHistoric = await Removals.find({
    localID,
    datetimeRemoval: {
      $lt: datetimeInit,
    },
    status: { $ne: "DELETED" },
  });

  // GENERAR STRING DEL MES
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
    "Diciembre",
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
      x: 0,
    },
    { materialID: "TEXTILS", name: "Textiles", quantity: 0, prev: 0, x: 0 },
  ];

  removalsActual.forEach((element) => {
    element.materials.forEach((material) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].materialID === material.material) {
          data[i].quantity += material.quantity * 1;
        }
      }
    });
  });
  removalsPrev.forEach((element) => {
    element.materials.forEach((material) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].materialID === material.material) {
          data[i].prev += material.quantity * 1;
        }
      }
    });
  });
  removalsHistoric.forEach((element) => {
    element.materials.forEach((material) => {
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
    { ID: "CO2", q: 0, unity: "Kg" },
  ];

  data.map((element) => {
    let temp = ecoData.filter(
      (material) => material.materialID === element.materialID
    )[0];
    payload.push({
      material: temp.materialID,
      name: temp.name,
      prev: element.prev,
      x: element.x,
      v: !!parseInt(element.quantity),
      quantity: element.quantity,
      color: temp.color,
      data: temp.savesPerKilogram.map((spk) => {
        return {
          name: spk.name,
          quantity:
            Math.round(spk.quantity * element.quantity) + " " + spk.unity,
          q: Math.round(spk.quantity * element.quantity),
          ID: spk.ID,
          unity: spk.unity,
        };
      }),
    });
  });

  payload
    .filter((element) => element.v)
    .forEach((data) => {
      data.data.forEach((element) => {
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

  // OUTLABEL

  var dataOutlabel = "";
  var labelsOutLabel = "";
  var colorsOutlabel = "";
  payload.forEach((element, i) => {
    if (element.quantity) {
      labelsOutLabel += '"' + element.name + '",';
      dataOutlabel += Math.round(element.quantity) + ",";
      colorsOutlabel += '"' + element.color + '",';
    }
  });

  // METADATA DE ECOEQUIVALENCIAS
  total.forEach((element) => {
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
    labelsOutLabel.substr(0, labelsOutLabel.length - 1) +
    "], datasets:[{label:'Materiales',data:[" +
    dataOutlabel.substr(0, dataOutlabel.length - 1) +
    "], backgroundColor:[" +
    colorsOutlabel.substr(0, colorsOutlabel.length - 1) +
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

  // CREANDO REPORTE EN BASE DE DATOS
  const report = await Reports.create({
    materials: data,
    localID,
    datetimeInit,
    datetimeFinish,
    month,
  });

  const qrtext =
    "https://s3.amazonaws.com/" +
    process.env.AWS_BUCKET_NAME +
    "/reports/" +
    localID +
    "_" +
    report._id +
    ".pdf";
  const qr =
    "https://quickchart.io/qr?text=" +
    qrtext +
    "&dark=457595&light=fff&ecLevel=Q&format=png";

  const compiled = ejs.compile(fs.readFileSync("./views/pdf.ejs", "utf8"));

  var html = compiled({
    ID: localID + "_" + report._id,
    payload: payload.filter((element) => element.v),
    total,
    year,
    month,
    company,
    totalKilos,
    qr,
    data,
    outlabeledPie,
    metadata,
    acumulated,
  });

  // res.render("pdf", {
  //   ID: localID + "_" + report._id,
  //   payload: payload.filter(element => element.v),
  //   total,
  //   year,
  //   month,
  //   company,
  //   totalKilos,
  //   qr,
  //   data,
  //   outlabeledPie,
  //   metadata,
  //   acumulated
  // });

  var buffer = null;
  if (process.env.ENV === "production") {
    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/google-chrome-stable",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html);
    buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        left: "0px",
        top: "0px",
        right: "0px",
        bottom: "0px",
      },
    });
    await browser.close();
  } else {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
    buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        left: "0px",
        top: "0px",
        right: "0px",
        bottom: "0px",
      },
    });
    await browser.close();
    res.end(buffer);
  }

  uploadFile
    .upload({
      pdf: buffer,
      path: "reports",
      ID: String(localID) + "_" + String(report._id),
    })
    .then((response) => {
      report.url = response;
      report.save();
      console.log(response);

      res.end(buffer);
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteReport = async (req, res) => {
  var report = await Reports.findOne({ _id: req.query.reportID });

  if (report) {
    deleteObjectS3
      .index({
        path: "reports",
        name: String(report.localID) + "_" + String(report._id) + ".pdf",
      })
      .then(async (response) => {
        report = await Reports.deleteOne({ _id: req.query.reportID });
        return res.status(200).send();
      });
  } else {
    return res.status(404).send();
  }
};
