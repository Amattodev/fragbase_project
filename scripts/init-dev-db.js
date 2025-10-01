const fs = require("fs");
const path = require("path");

const Database = require("better-sqlite3");

// 既存DBがある場合はバックアップして作り直す
const dbPath = path.join(__dirname, "../dev.db");
if (fs.existsSync(dbPath)) {
  const backupPath = path.join(
    __dirname,
    `../dev.backup.${Date.now()}.db`,
  );
  fs.renameSync(dbPath, backupPath);
  console.log(`既存の dev.db をバックアップしました: ${backupPath}`);
}

const db = new Database(dbPath);

// マイグレーションファイルを読み込んで実行
const migrationsDir = path.join(__dirname, "../drizzle/migrations");
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

console.log("開発用データベースを初期化しています...");

migrationFiles.forEach((file) => {
  const sqlContent = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  console.log(`実行中: ${file}`);
  try {
    db.exec(sqlContent);
  } catch (e) {
    console.error(`マイグレーション実行中にエラー: ${file}`, e);
    throw e;
  }
});

console.log("開発用データベースの初期化が完了しました");
db.close();
