const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const helmet = require("helmet");

const AdminToolRouter = require("./routes/AdminToolRouter");
const WebAppRouter = require("./routes/webAppRouter");

const authRouter = require("./routes/auth");
const DataBase = require("./services/dataBase");
const AuctionNotify = require("./services/auctionNotify");
const SocketServices = require("./services/socketServices");
require("dotenv").config();

const app = express();
app.use(fileUpload());
app.use(helmet());
app.use(bodyParser.json({ limit: "30mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "30mb" }));

var server = null;

if (process.env.ENV === "development") {
  server = require("http").Server(app);
} else {
  server = require("http").Server(app);
}

const io = require("socket.io")(server);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// middleware CORS para gestionar peticiones de puertos diferentes
app.use(cors());

// middleware de sockets
app.use((req, res, next) => {
  res.io = io;
  next();
});

app.use(logger("dev"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Rutas!
app.use("/adminTool", AdminToolRouter);
app.use("/WebApp", WebAppRouter);
app.use("/auth", authRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  if (process.env.ENV === "development") {
    res.locals.error = err;
  } else {
    res.locals.error = {};
  }
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// Base de datos!!
DataBase.init();

AuctionNotify.exec();

io.on("connection", socket => {
  SocketServices.index(socket);
});

module.exports = {
  app,
  server
};
