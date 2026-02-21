import express from "express";
import cors from "cors";

const app = express();

// DB connection

// Middlewares
app.use(express.json());
app.use(cors());

// Routes

export default app;