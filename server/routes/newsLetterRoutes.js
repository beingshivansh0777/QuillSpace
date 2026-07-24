import express from "express";
import { subscribe } from "../contollers/newsletterController.js";

const newsletterRouter = express.Router();

newsletterRouter.post("/subscribe", subscribe);

export default newsletterRouter;