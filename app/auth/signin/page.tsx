import { redirect } from "next/navigation";

// ログイン専用ページは廃止。ヘッダーモーダルでのサインインに誘導するためトップへリダイレクト。
export default function DeprecatedSignInPage() {
  redirect("/");
}
