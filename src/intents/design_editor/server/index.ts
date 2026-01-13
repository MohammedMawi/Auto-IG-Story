import express from "express";
import cors from "cors";
import planStoryRouter from "./plan-story";

const app = express();

app.use(cors({ origin: true }));
app.use("/api", planStoryRouter);

app.listen(3001, () => console.log("API on http://localhost:3001"));
