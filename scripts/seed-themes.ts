// 02_theme_seed.xlsx → themes 테이블 import 스크립트
// 실행: pnpm seed:themes (또는 npm run seed:themes)

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import { db } from "../src/lib/db";

interface SeedRow {
  테마명: string;
  슬러그: string;
  대분류: string;
  중분류?: string;
  설명?: string;
  "예상 종목 수"?: number;
  "글로벌 범위"?: string;
  "SEO 우선순위"?: string;
}

async function main() {
  const path = resolve(process.cwd(), "../02_theme_seed.xlsx");
  console.log(`📂 시드 파일 로드: ${path}`);

  const buffer = readFileSync(path);
  const wb = XLSX.read(buffer);
  const ws = wb.Sheets["테마 시드 312"] ?? wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<SeedRow>(ws);
  console.log(`📊 ${rows.length}개 테마 발견`);

  const scopeMap: Record<string, string> = {
    한국: "KR",
    한미: "KR_US",
    한미일: "KR_US_JP",
  };

  const priorityMap: Record<string, number> = {
    "★": 1,
    "★★": 2,
    "★★★": 3,
  };

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    if (!row.테마명 || !row.슬러그) continue;
    const seoPriority = priorityMap[row["SEO 우선순위"] ?? "★"] ?? 1;
    const globalScope = scopeMap[row["글로벌 범위"] ?? "한국"] ?? "KR";

    const result = await db.theme.upsert({
      where: { slug: row.슬러그 },
      create: {
        slug: row.슬러그,
        nameKo: row.테마명,
        category: row.대분류,
        subCategory: row.중분류,
        description: row.설명,
        seoPriority,
        globalScope,
      },
      update: {
        nameKo: row.테마명,
        category: row.대분류,
        subCategory: row.중분류,
        description: row.설명,
        seoPriority,
        globalScope,
      },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
    else updated++;
  }

  console.log(`✅ 신규: ${created} / 갱신: ${updated}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
