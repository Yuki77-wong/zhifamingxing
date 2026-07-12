import {
  Router
} from "express";

import {
  getRightsGuide,
  listRightsGuides
} from "../controllers/rightsGuideController.js";


const router =
  Router();


router.get(
  "/",
  listRightsGuides
);


router.get(
  "/:guideCode",
  getRightsGuide
);


export default router;
