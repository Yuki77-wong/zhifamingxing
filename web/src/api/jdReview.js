import http from "./http.js";


export function createJdReview(data) {
  return http.post(
    "/jd-reviews",
    data
  );
}