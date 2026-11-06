import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getResourceType,
  imageFileFilter,
  resourceFileFilter,
} from "../../src/middlewares/upload.middleware.js";

// Gọi fileFilter của multer và trả về [error, accepted].
const runFilter = (filter, file) =>
  new Promise((resolve) => filter({}, file, (error, accepted) => resolve([error, accepted])));

describe("getResourceType", () => {
  test("ánh xạ đuôi file sang loại tài liệu của bài học", () => {
    assert.equal(getResourceType("Slide bài 1.PDF"), "pdf");
    assert.equal(getResourceType("bai-tap.docx"), "docx");
    assert.equal(getResourceType("data.xlsx"), "xlsx");
    assert.equal(getResourceType("source.zip"), "zip");
    assert.equal(getResourceType("ghi-chu.txt"), "txt");
  });

  test("trả về null với file không hỗ trợ", () => {
    assert.equal(getResourceType("setup.exe"), null);
    assert.equal(getResourceType("anh.png"), null);
    assert.equal(getResourceType("khong-co-duoi"), null);
    assert.equal(getResourceType(undefined), null);
  });
});

describe("imageFileFilter", () => {
  for (const mimetype of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
    test(`chấp nhận ${mimetype}`, async () => {
      const [error, accepted] = await runFilter(imageFileFilter, { mimetype, originalname: "a" });
      assert.equal(error, null);
      assert.equal(accepted, true);
    });
  }

  test("từ chối SVG và PDF", async () => {
    for (const mimetype of ["image/svg+xml", "application/pdf"]) {
      const [error] = await runFilter(imageFileFilter, { mimetype, originalname: "a" });
      assert.equal(error.statusCode, 400);
    }
  });
});

describe("resourceFileFilter", () => {
  test("chấp nhận tài liệu hợp lệ", async () => {
    const [error, accepted] = await runFilter(resourceFileFilter, { originalname: "bai-giang.pptx" });
    assert.equal(error, null);
    assert.equal(accepted, true);
  });

  test("từ chối file thực thi", async () => {
    const [error] = await runFilter(resourceFileFilter, { originalname: "virus.exe" });
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /Chỉ chấp nhận file/);
  });
});
