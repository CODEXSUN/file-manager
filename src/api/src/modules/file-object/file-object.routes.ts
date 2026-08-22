import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { fileManagerEnv } from "../../env.js";
import type { ResolveFileManagerContext } from "../../host.js";
import { FileObjectService } from "./file-object.service.js";

const identifier = z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/u) });
const query = z.object({
  folderUuid: z
    .string()
    .regex(/^[a-f0-9]{8}$/u)
    .optional(),
});
const linkPayload = z
  .object({
    connectionUuid: z
      .string()
      .regex(/^[a-f0-9]{8}$/u)
      .optional(),
    folderUuid: z
      .string()
      .regex(/^[a-f0-9]{8}$/u)
      .optional(),
    mimeType: z.string().trim().min(1).max(191),
    name: z.string().trim().min(1).max(255),
    url: z.url(),
  })
  .strict();

export async function registerFileObjectRoutes(
  app: FastifyInstance,
  resolveContext: ResolveFileManagerContext,
  service = new FileObjectService(),
) {
  app.get("/file-manager/files", async (request) => {
    const input = query.parse(request.query);
    return service.list(
      await resolveContext(request),
      input.folderUuid ?? null,
    );
  });
  app.post("/file-manager/files/upload", async (request, reply) => {
    const part = await request.file({
      limits: { fileSize: fileManagerEnv.FILE_MANAGER_MAX_UPLOAD_BYTES },
    });
    if (!part) throw new Error("A file is required.");
    const fields = part.fields as Record<string, { value?: unknown }>;
    const connectionUuid = textField(fields.connectionUuid);
    const folderUuid = textField(fields.folderUuid);
    const record = await service.upload({
      body: await part.toBuffer(),
      context: await resolveContext(request),
      mimeType: part.mimetype,
      name: part.filename,
      ...(connectionUuid ? { connectionUuid } : {}),
      ...(folderUuid ? { folderUuid } : {}),
    });
    return reply.code(201).send(record);
  });
  app.post("/file-manager/files/link", async (request, reply) => {
    const input = linkPayload.parse(request.body);
    const record = await service.link({
      mimeType: input.mimeType,
      name: input.name,
      url: input.url,
      context: await resolveContext(request),
      ...(input.connectionUuid ? { connectionUuid: input.connectionUuid } : {}),
      ...(input.folderUuid ? { folderUuid: input.folderUuid } : {}),
    });
    return reply.code(201).send(record);
  });
  app.get("/file-manager/files/:uuid/content", async (request, reply) => {
    const { uuid } = identifier.parse(request.params);
    const result = await service.content(await resolveContext(request), uuid);
    return sendFile(reply, result, false);
  });
  app.get("/file-manager/files/:uuid/download", async (request, reply) => {
    const { uuid } = identifier.parse(request.params);
    const result = await service.content(await resolveContext(request), uuid);
    return sendFile(reply, result, true);
  });
  app.delete("/file-manager/files/:uuid", async (request) => {
    const { uuid } = identifier.parse(request.params);
    return service.remove(await resolveContext(request), uuid);
  });
}

function sendFile(
  reply: FastifyReply,
  result:
    | { body: Buffer; mimeType: string; name: string }
    | { mimeType: string; name: string; redirect: string },
  download: boolean,
) {
  if ("redirect" in result) return reply.redirect(result.redirect);
  if (download) {
    reply.header(
      "content-disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(result.name)}`,
    );
  }
  return reply.type(result.mimeType).send(result.body);
}

function textField(field: { value?: unknown } | undefined) {
  return typeof field?.value === "string" && field.value.trim()
    ? field.value.trim()
    : undefined;
}
