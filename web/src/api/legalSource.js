import http from "./http.js";


export function getLegalSources() {
  return http.get(
    "/legal-sources"
  );
}