import http from "./http.js";


export function getRightsGuides() {
  return http.get(
    "/rights-guides"
  );
}


export function getRightsGuideByCode(
  guideCode
) {
  return http.get(
    `/rights-guides/${
      encodeURIComponent(
        guideCode
      )
    }`
  );
}
