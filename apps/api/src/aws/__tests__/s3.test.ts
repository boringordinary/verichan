import { test, expect } from "bun:test";
import { generateTempKey, buildS3Ref } from "../s3";

test("generateTempKey creates key with session prefix", () => {
  const key = generateTempKey("session-123", "front.jpg");
  expect(key).toStartWith("sessions/session-123/");
  expect(key).toEndWith(".jpg");
});

test("generateTempKey handles files without extension", () => {
  const key = generateTempKey("session-123", "noext");
  expect(key).toStartWith("sessions/session-123/");
  expect(key).toEndWith(".noext");
});

test("buildS3Ref creates correct S3Object structure", () => {
  const ref = buildS3Ref("my-key");
  expect(ref).toEqual({
    Bucket: expect.any(String),
    Name: "my-key",
  });
});
