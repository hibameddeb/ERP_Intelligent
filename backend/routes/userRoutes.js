const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  verifyToken,
  isAdmin,
  isStaff,
} = require("../middleware/authMiddleware");

router.post("/", verifyToken, isAdmin, userController.createUser);
router.put("/:id", verifyToken, isAdmin, userController.updateUser);
router.delete("/:id", verifyToken, isAdmin, userController.deleteUser);
router.patch(
  "/:id/status",
  verifyToken,
  isAdmin,
  userController.toggleUserStatus,
);
router.get("/", verifyToken, isStaff, userController.getUsers);
router.get(
  "/fournisseurs",
  verifyToken,
  isAdmin,
  userController.getFournisseurs,
);

module.exports = router;
