import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/HeaderPart";
import Footer from "@/components/FooterPart";

const inter = Inter({ subsets: ["latin"] });

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-13FE8LDX23"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-13FE8LDX23');
          `,
        }} />
      </head>
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
