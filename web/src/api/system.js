import http from "./http.js";

export function getSystemHealth() {
  return http.get("/health");
}

export function getDatabaseHealth() {
  return http.get("/health/database");
}