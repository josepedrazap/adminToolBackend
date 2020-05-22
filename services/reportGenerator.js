const Locals = require("../models/locals");
const Removals = require("../models/removals");
const Reports = require("../models/reports");
const ejs = require("ejs");
const fs = require("fs");
const puppeteer = require("puppeteer");
const stream = require("stream");
const uploadFile = require("../services/uploadFile");
const mongoose = require("mongoose");
const ecoeqData = require("../files/ecoData.json");

const days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

exports.createReport = async (req, res) => {
  var data = req.body;

  // Objeto que obtendrá todos los datos de creación para mejor manejo
  var payload = {
    local: null,
    name: "",
    datetimeLimitFirst: null,
    datetimeLimitSecond: null,
    datetimeLimitThird: null,

    datetimeInit: new Date(2020, 4, 1, 0, 0, 0),
    datetimeInitPrevius: null,
    localID: "5e6fdfa6f9c5cc484c7309cc", //data.localID,
    removals: null,
    ecoEq: {},
    charts: {
      bar: {
        labels: [],
        current: [],
        previus: [],
        historic: [],
        average: [],
      },
      pie: {
        labels: [],
        percent: [],
        colors: [],
      },
    },
    month: null,
    year: null,
    dateRange: "",
  };

  // Preparando fechas
  // -------------------------------------------------------------------- -----
  payload.month = payload.datetimeInit.getMonth();
  payload.year = payload.datetimeInit.getFullYear();

  payload.datetimeFinish = new Date(payload.year, payload.month + 1, 0, 0);
  payload.datetimeInitPrevius = new Date(payload.year, payload.month - 1, 0);

  payload.datetimeLimitFirst = new Date(payload.year, payload.month + 1, 1, 0);
  payload.datetimeLimitSecond = new Date(payload.year, payload.month, 0, 1);
  payload.datetimeLimitThird = new Date(payload.year, payload.month - 1, 1, 0);
  payload.datetimeLimitFourth = new Date(payload.year, payload.month - 2, 1, 0);
  payload.datetimeLimitFifth = new Date(payload.year, payload.month - 3, 1, 0);
  payload.datetimeLimitSixth = new Date(payload.year, payload.month - 4, 1, 0);
  payload.datetimeLimitSeventh = new Date(
    payload.year,
    payload.month - 5,
    1,
    0
  );
  //Nombre del rango de fechas
  if (payload.datetimeInit.getMonth() === payload.datetimeFinish.getMonth()) {
    payload.dateRange =
      months[payload.datetimeInit.getMonth()] + " " + payload.year;
  } else {
    payload.dateRange =
      months[payload.datetimeInit.getMonth()] +
      " ~ " +
      months[payload.datetimeInit.getMonth()] +
      " " +
      payload.year;
  }
  payload.datetimeReport =
    months[new Date().getMonth()] + " de " + new Date().getFullYear();
  payload.currentMonth = months[payload.datetimeInit.getMonth()];
  payload.previusMonth = months[payload.datetimeInit.getMonth() - 1];
  // -------------------------------------------------------------------------

  // Conseguir local populado
  payload.local = await Locals.findOne({ _id: payload.localID }).populate(
    "customerID"
  );
  // Nombre del local
  payload.name = payload.local.customerID.brand + " " + payload.local.name;

  // Obteniendo los materiales entre fechas
  // --------------------------------------------------
  payload.removals = (
    await Removals.aggregate([
      {
        $match: {
          localID: mongoose.Types.ObjectId(payload.localID),
          status: { $ne: "DELETE" },
        },
      },
      { $unwind: "$materials" },
      {
        $group: {
          _id: {
            material: "$materials.material",
            range: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$datetimeRemoval", payload.datetimeLimitFirst] },
                    { $gte: ["$datetimeRemoval", payload.datetimeLimitSecond] },
                  ],
                },
                "current",
                {
                  $cond: [
                    {
                      $and: [
                        {
                          $lt: [
                            "$datetimeRemoval",
                            payload.datetimeLimitSecond,
                          ],
                        },
                        {
                          $gte: [
                            "$datetimeRemoval",
                            payload.datetimeLimitThird,
                          ],
                        },
                      ],
                    },
                    "previus",
                    {
                      $cond: [
                        {
                          $and: [
                            {
                              $lt: [
                                "$datetimeRemoval",
                                payload.datetimeLimitThird,
                              ],
                            },
                          ],
                        },
                        "historic",
                        "others",
                      ],
                    },
                  ],
                },
              ],
            },
          },
          sum: { $sum: "$materials.quantity" },
        },
      },
      {
        $group: {
          _id: "$_id.material",
          data: { $push: { k: "$_id.range", v: "$sum" } },
        },
      },
      {
        $project: {
          _id: 1,
          data: { $arrayToObject: "$data" },
        },
      },
      { $sort: { _id: 1 } },
    ])
  ).map((removal) => {
    let temp = removal.data;
    return {
      material: removal._id,
      current: temp.current ? temp.current : 0,
      previus: temp.previus ? temp.previus : 0,
      historic:
        (temp.current ? temp.current : 0) +
        (temp.previus ? temp.previus : 0) +
        (temp.historic ? temp.historic : 0),
    };
  });
  // --------------------------------------------------

  // Consulta para obtener ultimos 3 meses
  //-----------------------------------------------------
  var acumulated = 0; // variable auxiliar

  payload.lastMonths = (
    await Removals.aggregate([
      {
        $match: {
          localID: mongoose.Types.ObjectId(payload.localID),
          status: { $ne: "DELETE" },
          datetimeRemoval: {
            $lt: payload.datetimeLimitFirst,
            $gte: payload.datetimeLimitSeventh,
          },
        },
      },
      {
        $project: {
          month: { $month: "$datetimeRemoval" },
          year: { $year: "$datetimeRemoval" },
          materials: "$materials",
        },
      },
      {
        $unwind: "$materials",
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          sum: {
            $sum: "$materials.quantity",
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])
  ).map((range) => {
    acumulated += range.sum;
    return {
      monthNum: range._id.month - 1,
      month: months[range._id.month - 1],
      current: range.sum,
      acumulated,
    };
  });
  // solucionando proble de los meses faltantes
  let arr = [];
  payload.lastMonths.forEach((el, i) => {
    if (i < payload.lastMonths.length - 1) {
      if (el.monthNum === 11) {
        if (payload.lastMonths[i + 1].monthNum !== 0) {
          arr.push(el);
          arr.push({
            monthNum: 0,
            month: months[0],
            current: 0,
            acumulated: el.acumulated,
          });
        }
      } else if (payload.lastMonths[i + 1].monthNum - el.monthNum !== 1) {
        arr.push(el);
        arr.push({
          monthNum: el.monthNum + 1,
          month: months[el.monthNum + 1],
          current: 0,
          acumulated: el.acumulated,
        });
      } else {
        arr.push(el);
      }
    } else {
      arr.push(el);
    }
  });
  payload.lastMonths = arr;
  // -------------------------------------------------------------------------

  // obetener fecha del primer retiro
  payload.datetimeFirstRemoval = (
    await Removals.findOne({
      localID: payload.localID,
      status: { $ne: "DELETE" },
    }).sort("datetimeRemoval")
  ).datetimeRemoval;

  payload.datetimeFirstRemoval =
    months[payload.datetimeFirstRemoval.getDate() - 1] +
    " de " +
    payload.datetimeFirstRemoval.getFullYear();

  // Consulta para obtener los retiros del mes
  payload.currentRemovals = (
    await Removals.aggregate([
      {
        $match: {
          localID: mongoose.Types.ObjectId(payload.localID),
          datetimeRemoval: {
            $lt: payload.datetimeLimitFirst,
            $gte: payload.datetimeLimitSecond,
          },
          transporterID: { $ne: null },
          payment: { $gt: 0 },
          status: { $ne: "DELETED" },
          "materials.quantity": { $gt: 0 },
        },
      },
      { $unwind: "$materials" },
      {
        $group: {
          _id: { _id: "$_id", datetimeRemoval: "$datetimeRemoval" },
          sum: { $sum: "$materials.quantity" },
        },
      },
      {
        $sort: { "_id.datetimeRemoval": 1 },
      },
    ])
  ).map((removal) => {
    return {
      value: removal.sum,
      date:
        days[removal._id.datetimeRemoval.getDay()] +
        " " +
        removal._id.datetimeRemoval.getDate() +
        ", " +
        removal._id.datetimeRemoval.getHours() +
        ":00 hrs",
    };
  });
  console.log(payload.currentRemovals);
  // Obteniendo ecoequivalencias
  // --------------------------------------------------
  var ecoeqMult = {};
  ecoeqData.map((eco) => {
    ecoeqMult[eco.materialID] = {
      ...eco,
    };
  });

  payload.removals = payload.removals.map((removal) => {
    var ecoEq = {};
    ecoeqMult[removal.material].savesPerKilogram.map((spm) => {
      if (!payload.ecoEq[spm.ID]) {
        payload.ecoEq[spm.ID] = {
          current: 0,
          historic: 0,
          unity: spm.unity,
        };
      }
      payload.ecoEq[spm.ID].current =
        parseInt(spm.quantity * removal.current) +
        parseInt(
          payload.ecoEq[spm.ID].current ? payload.ecoEq[spm.ID].current : 0
        );

      payload.ecoEq[spm.ID].historic =
        parseInt(spm.quantity * removal.historic) +
        parseInt(
          payload.ecoEq[spm.ID].historic ? payload.ecoEq[spm.ID].historic : 0
        );

      ecoEq[spm.ID] = {
        current: 0,
        historic: 0,
        unity: spm.unity,
      };

      ecoEq[spm.ID].current = parseInt(spm.quantity * removal.current);
      ecoEq[spm.ID].historic = parseInt(spm.quantity * removal.historic);
    });
    return {
      ...removal,
      name: ecoeqMult[removal.material].name,
      ecoEq,
      color: ecoeqMult[removal.material].color,
    };
  });

  // --------------------------------------------------

  // Generando gráficos
  // --------------------------------------------------
  payload.removals.map((removal) => {
    payload.charts.bar.labels.push(ecoeqMult[removal.material].name);
    payload.charts.bar.current.push(removal.current);
    payload.charts.bar.previus.push(removal.previus);
    payload.charts.bar.historic.push(removal.historic);
    payload.charts.bar.average.push(removal.historic);
    removal.current &&
      payload.charts.pie.labels.push(ecoeqMult[removal.material].name);
    removal.current && payload.charts.pie.percent.push(removal.current);
    removal.current && payload.charts.pie.colors.push(removal.color);
  });

  // Grafico de barras comparativo
  payload.barChartDataComp = JSON.stringify({
    labels: payload.charts.bar.labels,
    datasets: [
      {
        label: payload.currentMonth,
        data: payload.charts.bar.current,
        backgroundColor: "#303f9f",
      },
      {
        label: payload.previusMonth,
        data: payload.charts.bar.previus,
        backgroundColor: "#FF3131",
      },
    ],
  });

  // Grafico de pie
  payload.total = payload.charts.pie.percent.reduce(
    (sum, current) => (sum += current),
    0
  );
  const labelsTemp = [];
  payload.charts.pie.percent = payload.charts.pie.percent.map((element, i) => {
    let temp = Math.round((element / payload.total) * 1000) / 10;
    labelsTemp.push(payload.charts.pie.labels[i] + " " + temp + "%");
    return temp;
  });
  payload.charts.pie.labels = labelsTemp;
  payload.pieChartData = JSON.stringify({
    labels: payload.charts.pie.labels,
    datasets: [
      {
        label: "Relación porcentual materiales del mes",
        data: payload.charts.pie.percent,
        backgroundColor: payload.charts.pie.colors,
      },
    ],
  });

  // Gráfico acumulado
  payload.barChartDataAc = JSON.stringify({
    labels: payload.lastMonths.map((el) => el.month),
    datasets: [
      {
        data: payload.lastMonths.map((el) => el.current),
        backgroundColor: "#303f9f",
        label: "Total",
      },
      {
        data: payload.lastMonths.map((el) => el.acumulated),
        backgroundColor: "#FF8000",
        label: "Acumulado",
      },
    ],
  });

  // Codigo qr
  let qrtext =
    "https://s3.amazonaws.com/" +
    process.env.AWS_BUCKET_NAME +
    "/reports/" +
    payload.localID +
    "_" +
    payload.dateRange +
    ".pdf";

  payload.urlQr =
    "https://quickchart.io/qr?text=" +
    qrtext +
    "&dark=000&light=fff&ecLevel=Q&format=svg";

  // Guardar pdf payload
  const report = await Reports.create({
    payload: JSON.stringify(payload),
    localID: payload.localID,
    datetimeInit: payload.datetimeInit,
    datetimeFinish: payload.datetimeFinish,
    dateRange: payload.dateRange,
    url: payload.urlQr,
  });

  if (report) {
    const compiled = ejs.compile(fs.readFileSync("./views/pdf2.ejs", "utf8"));

    var html = compiled({ payload });
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
    await timeout(5000);

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

    uploadFile
      .upload({
        pdf: buffer,
        path: "reports",
        ID: String(payload.localID) + "_" + payload.dateRange,
      })
      .then((_response) => {
        var readStream = new stream.PassThrough();
        readStream.end(buffer);
        let filename = (payload.name + "_" + payload.dateRange)
          .split(" ")
          .join("_");
        res.set(
          "Content-disposition",
          "attachment; filename=" + filename + ".pdf"
        );
        res.set("Content-Type", "text/plain");
        readStream.pipe(res);
      })
      .catch((err) => {
        console.log(err);
        return res.status(400).send();
      });
  } else {
    return res.status(400).send();
  }

  // --------------------------------------------------
  //res.render("pdf2", { payload });
  //return res.status(200).send({ payload });
};
