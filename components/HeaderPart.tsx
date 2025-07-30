"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const handleLogoClick = () => {
    // 完全にページをリロードして確実にリセット
    window.location.href = "/";
  };
  return (
    <div className="flex justify-between items-center mb-6">
      <Link href="/" onClick={handleLogoClick}>
        <Image
          src="/fragbase_logo.png"
          alt="FragBase"
          width={210}
          height={70}
          className="object-contain"
          priority
        />
      </Link>
      <Link href="/post">
        <Button className="bg-[#7DB7E8] hover:bg-[#6AA7D8] text-black px-6 py-2 rounded-full">
          ＋ 投稿
        </Button>
      </Link>
    </div>
  );
}
