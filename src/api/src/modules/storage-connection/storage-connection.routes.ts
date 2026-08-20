import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ResolveFileManagerContext } from "../../host.js";
import { StorageConnectionService } from "./storage-connection.service.js";

const provider = z.enum([
  "local",
  "external_url",
  "s3",
  "cloudflare_r2",
  "google_drive",
]);
const payload = z
  .object({
    config: z.record(z.string(), z.unknown()),
    credentials: z.record(z.string(), z.unknown()).optional(),
    isDefault: z.boolean(),
    name: z.string().trim().min(1).max(191),
    provider,
    status: z.enum(["active", "inactive"]),
  })
  .strict();
const identifier = z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/u) });

export async function registerStorageConnectionRoutes(
  app: FastifyInstance,
  resolveContext: ResolveFileManagerContext,
  service = new StorageConnectionService(),
) {
  app.get("/file-manager/connections", async (request) =>
    service.list(await resolveContext(request)),
  );
  app.post("/file-manager/connections", async (request, reply) => {
    const record = await service.create(
      await resolveContext(request),
      cleanPayload(payload.parse(request.body)),
    );
    return reply.code(201).send(record);
  });
  app.put("/file-manager/connections/:uuid", async (request) => {
    const { uuid } = identifier.parse(request.params);
    return service.update(
      await resolveContext(request),
      uuid,
      cleanPayload(payload.parse(request.body)),
    );
  });
  app.post("/file-manager/connections/:uuid/test", async (request) => {
    const { uuid } = identifier.parse(request.params);
    return service.test(await resolveContext(request), uuid);
  });
  app.delete("/file-manager/connections/:uuid", async (request) => {
    const { uuid } = identifier.parse(request.params);
    return service.remove(await resolveContext(request), uuid);
  });
}

function cleanPayload(input: z.infer<typeof payload>) {
  return {
    config: input.config,
    isDefault: input.isDefault,
    name: input.name,
    provider: input.provider,
    status: input.status,
    ...(input.credentials ? { credentials: input.credentials } : {}),
  };
}
