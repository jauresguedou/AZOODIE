const express = require("express");

const router = express.Router();

const {showRegisterForm, register, showLoginForm, login, logout, verifyEmail} = require("../controllers/authController");


router.get("/register", showRegisterForm);
router.post("/register", register);
router.get("/login", showLoginForm);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify/:token", verifyEmail);


module.exports = router;