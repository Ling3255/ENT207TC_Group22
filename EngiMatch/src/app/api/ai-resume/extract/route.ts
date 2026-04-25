/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireAuth,
} from "@/lib/api-utils";

const EXTRACT_TIMEOUT = 30_000; // 30s

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("文件提取超时，请改用粘贴模式")), ms)
    ),
  ]);
}

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAuth(req);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return errorResponse("No file provided", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    text = buffer.toString("utf-8");
  } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    const { PDFParse } = (await import("pdf-parse")) as any;
    const pdfParse = PDFParse as any;
    const data = (await withTimeout(pdfParse(buffer), EXTRACT_TIMEOUT)) as any;
    text = data.text as string;
  } else if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword" ||
    file.name.endsWith(".docx") ||
    file.name.endsWith(".doc")
  ) {
    const mammothModule = (await import("mammoth")) as any;
    const mammoth = mammothModule.default || mammothModule;
    const result = (await withTimeout(
      mammoth.extractRawText({ buffer }),
      EXTRACT_TIMEOUT
    )) as any;
    text = result.value as string;
  } else {
    return errorResponse("Unsupported file type", 400);
  }

  if (!text || text.trim().length === 0) {
    return errorResponse(
      "未能从文件中提取到文本内容，请检查文件是否包含可识别的文字，或改用粘贴模式",
      422
    );
  }

  return successResponse({ text: text.trim(), filename: file.name });
});
