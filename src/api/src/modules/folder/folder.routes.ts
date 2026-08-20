import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ResolveFileManagerContext } from "../../host.js";
import { FolderService } from "./folder.service.js";

const identifier = z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/u) });
const query = z.object({
  parentUuid: z
    .string()
    .regex(/^[a-f0-9]{8}$/u)
    .optional(),
});
const payload = z
  .object({
    name: z.string().trim().min(1).max(191),
    parentUuid: z
      .string()
      .regex(/^[a-f0-9]{8}$/u)
      .nullable()
      .optional(),
  })
  .strict();

export async function registerFolderRoutes(
  app: FastifyInstance,
  resolveContext: ResolveFileManagerContext,
  service = new FolderService(),
) {
  app.get("/file-manager/folders", async (request) => {
    const input = query.parse(request.query);
    return service.list(
      await resolveContext(request),
      input.parentUuid ?? null,
    );
  });
  app.post("/file-manager/folders", async (request, reply) => {
    const input = payload.parse(request.body);
    const folder = await service.create(
      await resolveContext(request),
      input.name,
      input.parentUuid ?? null,
    );
    return reply.code(201).send(folder);
  });
  app.put("/file-manager/folders/:uuid", async (request) => {
    const { uuid } = identifier.parse(request.params);
    return service.rename(
      await resolveContext(request),
      uuid,
      payload.parse(request.body).name,
    );
  });
  app.delete("/file-manager/folders/:uuid", async (request) => {
    const { uuid } = identifier.parse(request.params);
    return service.remove(await resolveContext(request), uuid);
  });
}
