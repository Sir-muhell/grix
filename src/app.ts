import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { connectDB } from "./config/db";
import userRoutes from "./routes/userRoutes";
import eventRoutes from "./routes/eventRoutes";
import { handleError } from "./config/handler";

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.get("/", (req, res) => {
  res.send("Event Ticketing API");
});
app.use(handleError);

export default app;
