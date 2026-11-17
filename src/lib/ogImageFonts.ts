import { readFile } from "node:fs/promises";
import { join } from "node:path";

const regularFont = readFile(join(process.cwd(), "assets", "fonts", "Pretendard-Regular.woff"));
const boldFont = readFile(join(process.cwd(), "assets", "fonts", "Pretendard-Bold.woff"));

export async function getOgImageFonts() {
  const [regular, bold] = await Promise.all([regularFont, boldFont]);
  return [
    { name: "Pretendard", data: regular, style: "normal" as const, weight: 400 as const },
    { name: "Pretendard", data: bold, style: "normal" as const, weight: 700 as const },
  ];
}
