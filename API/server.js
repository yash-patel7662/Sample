const express = require("express");
const bodyParser = require("body-parser");
const db = require("./config/database");
const APIError = require("./helpers/APIError");
const httpStatus = require("http-status");
const cors = require("cors");

const logger = require("morgan");

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use(bodyParser.urlencoded({ limit: "15gb", extended: false }));
app.use(bodyParser.json());

app.use(cors());

app.use(logger("dev"));

db.connection().then((database) => {
  module.exports = database;

  app.use("/api/user", require("./routes/user.route"));

  app.use((err, req, res, next) => {
    if (err instanceof expressValidation.ValidationError) {
      // validation error contains errors which is an array of error each containing message[]
      const unifiedErrorMessage = err.errors
        .map((Error) => Error.messages.join(". "))
        .join(" and ");
      const error = new APIError(unifiedErrorMessage, err.status, true);
      return next(error);
    } else if (!(err instanceof APIError)) {
      const apiError = new APIError(
        err.message,
        err.status,
        err.name === "UnauthorizedError" ? true : err.isPublic
      );
      return next(apiError);
    }
    return next(err);
  });

  app.use((req, res, next) => {
    const err = new APIError("API Not Found", httpStatus.NOT_FOUND, true);
    return next(err);
  });

  app.use((err, req, res, next) => {
    res.status(err.status).json({
      error: {
        message: err.isPublic ? err.message : httpStatus[err.status],
      },
    });
  });
  app.listen(process.env.PORT || 8000);
  console.log("Server start on port 8000");
});
