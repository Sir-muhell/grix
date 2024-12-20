// Importing module
import express from "express";
import dotenv from "dotenv";
dotenv.config();

import app from "./src/app";

const PORT = process.env.PORT || 4000;

// Server setup
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
