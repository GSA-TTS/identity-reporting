import { mkdir, copyFile } from "fs/promises";
import { join } from "path";

Promise.all(
  ["/daily-auths-report/", "/daily-dropoffs-report/"].map(async (path) => {
    const dir = join("_site", path);
    await mkdir(dir, { recursive: true });
    await copyFile("_site/index.html", join(dir, "index.html"));
  })
);
