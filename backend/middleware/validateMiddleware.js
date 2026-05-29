const { validationResult } = require("express-validator");
const { sendError } = require("../utils/responseHandler");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, errors.array()[0].msg);
  }
  next();
};

module.exports = { validate };
