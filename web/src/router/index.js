import {
  createRouter,
  createWebHistory
} from "vue-router";

import HomeView
from "../views/HomeView.vue";

import JdReviewView
from "../views/JdReviewView.vue";

import LegalKnowledgeView
from "../views/LegalKnowledgeView.vue";


const routes = [

  {

    path:
      "/",

    name:
      "home",

    component:
      HomeView

  },


  {

    path:
      "/jd-review",

    name:
      "jd-review",

    component:
      JdReviewView

  },


  {

    path:
      "/legal-knowledge",

    name:
      "legal-knowledge",

    component:
      LegalKnowledgeView

  }

];


const router =
  createRouter({

    history:
      createWebHistory(),

    routes,

    scrollBehavior() {

      return {

        top:
          0

      };

    }

  });


export default router;