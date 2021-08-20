import "./css/style.css";
import { path } from "./report";

const app = document.querySelector("#app");
if (app) {
  app.textContent = `example URL: ${path({
    reportName: "daily-auths-report",
    date: new Date(),
  })}`;
}
