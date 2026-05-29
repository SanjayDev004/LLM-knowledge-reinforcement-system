const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");

const { registerUser, loginUser, getMe } = require("../controllers/authController");
const { protect }  = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required")
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerValidation, validate, registerUser);
router.post("/login",    loginValidation,    validate, loginUser);
router.get("/me",        protect,            getMe);

module.exports = router;
