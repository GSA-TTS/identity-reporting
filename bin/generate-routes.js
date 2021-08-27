import { mkdir, copyFile } from "fs/promises";
import { join } from "path";
import { ROUTES } from "../src/routes/index.tsx";

Promise.all(
  Object.keys(ROUTES).map(async (path) => {
    const dir = join("_site", path);
    await mkdir(dir, { recursive: true });
    await copyFile("_site/index.html", join(dir, "index.html"));
  })
);
