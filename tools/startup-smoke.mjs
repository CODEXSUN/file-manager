import Fastify from "fastify";
import {
  closeFileManagerDatabase,
  registerFileManagerApi,
} from "../dist/api/index.js";

const app = Fastify({ logger: false });

try {
  await registerFileManagerApi(app, {
    resolveContext: () => ({
      actorId: "startup-smoke",
      host: "cxapp",
      tenantId: "startup-smoke",
    }),
  });
  await app.ready();

  for (const path of [
    "/file-manager/connections",
    "/file-manager/folders",
    "/file-manager/files",
  ]) {
    const response = await app.inject({ method: "GET", url: path });
    if (response.statusCode !== 200) {
      throw new Error(
        `${path} returned ${response.statusCode}: ${response.body}`,
      );
    }
  }

  console.info(
    "File Manager startup, MariaDB migrations, and read routes are healthy.",
  );
} finally {
  await app.close();
  await closeFileManagerDatabase();
}
