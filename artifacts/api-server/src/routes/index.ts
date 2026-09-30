import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agrobrainRouter from "./agrobrain";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agrobrainRouter);

export default router;
