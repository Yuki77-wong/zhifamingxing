import {
  Router
} from "express";

import {
  createJdReview
} from "../controllers/jdReviewController.js";


const router =
  Router();


router.post(
  "/",
  createJdReview
);


export default router;
