import { config } from "dotenv";

import { ensureQuizMaterialTables } from "../features/quiz/lib/ensure-quiz-material-schema";

config({ path: ".env.local" });

async function main() {
  await ensureQuizMaterialTables();
  console.log("quiz_event_material tables are ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
