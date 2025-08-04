import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/HeaderPart";
import Footer from "@/components/FooterPart";

const inter = Inter({ subsets: ["latin"] });

//TODO: SEO設計時にメタディスクリプションを設定する
export const metadata: Metadata = {
  title: "FRAGBASE - FPSゲーマーのための設定共有プラットフォーム",
  description:
    "APEXやVALORANTなど、FPSの感度設定・DPI・キャラ別設定が探せるユーザー投稿型掲示板サービス。他人の設定から学べる新しい発見を。",
  keywords: [
    "FPS",
    "ゲーム設定",
    "感度",
    "DPI",
    "VALORANT",
    "Apex Legends",
    "Overwatch2",
    "設定共有",
    "キャラ別設定",
  ],
  openGraph: {
    title: "FRAGBASE - FPSゲーマーのための設定共有プラットフォーム",
    description:
      "APEXやVALORANTなど、FPSの感度設定・DPI・キャラ別設定が探せるユーザー投稿型掲示板サービス。他人の設定から学べる新しい発見を。",
    url: "https://fragbaseapp.com",
    siteName: "FRAGBASE",
    images: [
      {
        url: "https://fragbaseapp.com/fragbase_ogp.png",
        width: 1200,
        height: 630,
        alt: "FragBase",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FRAGBASE - FPSゲーマーのための設定共有プラットフォーム",
    description:
      "APEXやVALORANTなど、FPSの感度設定・DPI・キャラ別設定が探せるユーザー投稿型掲示板サービス。他人の設定から学べる新しい発見を。",
    images: ["https://fragbaseapp.com/fragbase_ogp.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  //サイトアイコンに使われる
  // icons: {
  //   icon: "/favicon.ico",
  //   apple: "/apple-touch-icon.png",
  // },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-13FE8LDX23"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-13FE8LDX23');
          `,
          }}
        />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-[#1F1F1F] text-[#F5F5F5] p-4`}
      >
        <div className="flex flex-col min-h-screen">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
