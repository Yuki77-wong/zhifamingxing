import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";

import JdReviewView from "../views/JdReviewView.vue";


const routes = [
  {
    path: "/",

    name: "home",

    component: HomeView
  },

  {
    path: "/jd-review",

    name: "jd-review",

    component: JdReviewView
  }
];


const router = createRouter({
  history: createWebHistory(),

  routes,

  scrollBehavior() {
    return {
      top: 0
    };
  }
});


export default router;