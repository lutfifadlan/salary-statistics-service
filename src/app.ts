import express from "express";
import cors from "cors";
import helmet from "helmet";
import Redis from "ioredis";
import morgan from "morgan";
import { createStream } from "rotating-file-stream";
import path from "path";
import bodyParser from "body-parser";
import morganBody from "morgan-body";

import SalaryRouter from "./routers/SalaryRouter";
import SummaryStatisticsRouter from "./routers/SummaryStatisticsRouter";
import AuthRouter from "./routers/AuthRouter";
import authorizationMiddleware from "./middlewares/authorization.middleware";
import errorMiddleware from "./middlewares/error.middleware";
import { insertDatasetToRedis } from "./utils/insert-dataset";

const accessLogStream = createStream("access.log", {
  interval: "1d",
  path: path.join(__dirname, "log"),
});

const app = express();
const redis = new Redis({
  host: "redis",
  port: 6379,
});

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("combined", { stream: accessLogStream }));

morganBody(app);

app.use("/auth", AuthRouter);
app.use("/salaries", authorizationMiddleware, SalaryRouter);
app.use(
  "/salary-summary-stats",
  authorizationMiddleware,
  SummaryStatisticsRouter
);
app.use(errorMiddleware);

(async () => await insertDatasetToRedis(redis))();

export = app;
