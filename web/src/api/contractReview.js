import http from "./http.js";


export function createContractReview(
  data
) {
  return http.post(
    "/contract-reviews",
    data
  );
}
