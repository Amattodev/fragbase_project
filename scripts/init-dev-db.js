const fs = require("fs");
const path = require("path");

const Database = require("better-sqlite3");

const db = new Database("./dev.db");

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
  db.exec(sqlContent);
});

console.log("開発用データベースの初期化が完了しました");
db.close();
