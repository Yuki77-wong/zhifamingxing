import {
  Router
} from "express";

import {
  createContractReview
} from "../controllers/contractReviewController.js";


const router =
  Router();


router.post(
  "/",
  createContractReview
);


export default router;
