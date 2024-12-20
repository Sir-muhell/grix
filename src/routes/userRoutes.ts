import express, { Router } from "express";
import {
  registerUser,
  loginUser,
  suspendUser,
  approveUser,
  getAllEventOwners,
  getBaseUsers,
  recoverPassword,
  updatePassword,
  changePassword,
} from "../controllers/userController";
import { verifyToken, checkRole, authenticateUser } from "../middlewares/auth";

const router: Router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.patch(
  "/approve/:userId",
  verifyToken,
  checkRole(["EVENT_OWNER", "SUPER_ADMIN"]),
  approveUser
);
router.patch(
  "/suspend/:userId",
  verifyToken,
  checkRole(["EVENT_OWNER", "SUPER_ADMIN"]),
  suspendUser
);
router.get("/event-owners", authenticateUser, getAllEventOwners);
router.get("/base-users", authenticateUser, getBaseUsers);
router.post("/recover-password", recoverPassword);
router.post("/update-password", updatePassword);
router.post("/change-password", authenticateUser, changePassword);

export default router;
