import {
  Router
} from "express";

import {
  listLegalSources
} from "../controllers/legalSourceController.js";


const router =
  Router();


router.get(
  "/",
  listLegalSources
);


export default router;