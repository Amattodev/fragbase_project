import { handlers } from "@/auth";

// 強制的にNodeランタイムで実行（Edgeでのbetter-sqlite3エラー回避）
export const runtime = "nodejs";
export const { GET, POST } = handlers;
