const express = require("express");
const router = express.Router();
const { getUser, registerUser, getUserById, updateUser, deleteUser, loginUser } = require("../controllers/controllerUser");

router.get("/user", getUser);
router.get("/user/:id", getUserById);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/user/:id", updateUser);
router.delete("/user/:id", deleteUser);

module.exports = router;