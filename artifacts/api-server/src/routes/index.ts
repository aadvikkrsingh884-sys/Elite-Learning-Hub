import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import subjectsRouter from "./subjects";
import progressRouter from "./progress";
import testsRouter from "./tests";
import questionsRouter from "./questions";
import bookmarksRouter from "./bookmarks";
import resultsRouter from "./results";
import dashboardRouter from "./dashboard";
import resourcesRouter from "./resources";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(subjectsRouter);
router.use(progressRouter);
router.use(testsRouter);
router.use(questionsRouter);
router.use(bookmarksRouter);
router.use(resultsRouter);
router.use(dashboardRouter);
router.use(resourcesRouter);

export default router;
