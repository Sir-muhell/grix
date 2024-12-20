import express from "express";
import { createEvent } from "../controllers/eventController";
import { verifyToken, checkRole } from "../middlewares/auth";

const router = express.Router();

router.post("/", verifyToken, createEvent);

export default router;
