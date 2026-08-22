import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { encodePath, optionalUrl, requiredText } from "./provider-utils.js";
import type { ProviderConnection, StoredObject } from "./provider.types.js";

export async function testS3Provider(connection: ProviderConnection) {
  await s3Client(connection).send(
    new HeadBucketCommand({
      Bucket: requiredText(connection.config.bucket, "Bucket"),
    }),
  );
}

export async function putS3Object(
  connection: ProviderConnection,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<StoredObject> {
  await s3Client(connection).send(
    new PutObjectCommand({
      Body: body,
      Bucket: requiredText(connection.config.bucket, "Bucket"),
      ContentType: contentType,
      Key: key,
    }),
  );
  const base = optionalUrl(connection.config.publicBaseUrl);
  return {
    providerKey: key,
    publicUrl: base ? `${base}/${encodePath(key)}` : null,
  };
}

export async function getS3Object(connection: ProviderConnection, key: string) {
  const result = await s3Client(connection).send(
    new GetObjectCommand({
      Bucket: requiredText(connection.config.bucket, "Bucket"),
      Key: key,
    }),
  );
  return Buffer.from(await result.Body!.transformToByteArray());
}

export async function deleteS3Object(
  connection: ProviderConnection,
  key: string,
) {
  await s3Client(connection).send(
    new DeleteObjectCommand({
      Bucket: requiredText(connection.config.bucket, "Bucket"),
      Key: key,
    }),
  );
}

function s3Client(connection: ProviderConnection) {
  const endpoint = optionalUrl(connection.config.endpoint);
  return new S3Client({
    credentials: {
      accessKeyId: requiredText(
        connection.credentials.accessKeyId,
        "Access key ID",
      ),
      secretAccessKey: requiredText(
        connection.credentials.secretAccessKey,
        "Secret access key",
      ),
    },
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle: Boolean(connection.config.forcePathStyle),
    region: requiredText(connection.config.region, "Region"),
  });
}
