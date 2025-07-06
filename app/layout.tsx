import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/HeaderPart";
import Footer from "@/components/FooterPart";

const inter = Inter({ subsets: ["latin"] });

//TODO: SEO設計時にメタディスクリプションを設定する
export const metadata: Metadata = {
  title: "FragBase - みんなのFPS設定",
  description: "FPSゲームの設定を共有するプラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen bg-[#1F1F1F] text-[#F5F5F5] p-4`}>
        <div className="flex flex-col min-h-screen">
          <Header />
            <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
