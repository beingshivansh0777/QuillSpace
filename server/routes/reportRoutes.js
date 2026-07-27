import express from "express";
import { createReport, getReports, dismissReport, deleteReportedContent } from "../contollers/reportController.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import validate from "../middleware/validate.js";
import { createReportSchema } from "../validators/schemas.js";

const reportRouter = express.Router();

reportRouter.post("/", auth, validate(createReportSchema), createReport);
reportRouter.get("/", adminAuth, getReports);
reportRouter.patch("/dismiss/:id", adminAuth, dismissReport);
reportRouter.post("/delete-content/:id", adminAuth, deleteReportedContent);

export default reportRouter;