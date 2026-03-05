import { test, expect } from "bun:test";
import { s3Client, textractClient, rekognitionClient } from "../clients";

test("s3Client is defined", () => {
  expect(s3Client).toBeDefined();
});

test("textractClient is defined", () => {
  expect(textractClient).toBeDefined();
});

test("rekognitionClient is defined", () => {
  expect(rekognitionClient).toBeDefined();
});
