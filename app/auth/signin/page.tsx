"use client"

import { signIn, getProviders } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function SignIn() {
  const [providers, setProviders] = useState<any>(null)

  useEffect(() => {
    (async () => {
      const res = await getProviders()
      setProviders(res)
    })()
  }, [])

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case "google":
        return "📧"
      case "discord":
        return "🎯"
      case "twitch":
        return "🎬"
      case "steam":
        return "🎮"
      default:
        return "🔑"
    }
  }

  const getProviderName = (providerId: string) => {
    switch (providerId) {
      case "google":
        return "Google でログイン"
      case "discord":
        return "Discord でログイン"
      case "twitch":
        return "Twitch でログイン"
      case "steam":
        return "Steam でログイン"
      default:
        return `${providerId} でログイン`
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        {/* ロゴ */}
        <div className="text-center">
          <Link href="/">
            <Image
              src="/fragbase_logo.png"
              alt="FragBase"
              width={200}
              height={67}
              className="mx-auto"
              priority
            />
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            ログイン
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ゲーマー向け認証でアカウントを作成
          </p>
        </div>

        {/* 認証プロバイダー */}
        <Card className="p-6">
          <div className="space-y-4">
            {providers && Object.keys(providers).length > 0 ? (
              Object.values(providers).map((provider: any) => (
                <Button
                  key={provider.name}
                  onClick={() => signIn(provider.id, { callbackUrl: "/" })}
                  className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
                  variant="outline"
                >
                  <span className="text-xl">
                    {getProviderIcon(provider.id)}
                  </span>
                  <span>{getProviderName(provider.id)}</span>
                </Button>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="mb-4 text-gray-500">
                  <p>🔧 OAuth認証情報が設定されていません</p>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Google OAuth設定:</strong></p>
                  <p>1. <a href="https://console.developers.google.com/" target="_blank" className="text-blue-600 hover:underline">Google Cloud Console</a> でプロジェクト作成</p>
                  <p>2. OAuth 2.0 クライアントID作成</p>
                  <p>3. リダイレクトURI: <code className="bg-gray-100 px-1 rounded">http://localhost:3000/api/auth/callback/google</code></p>
                  <p>4. .envにGOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRETを設定</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* フッター */}
        <div className="text-center text-sm text-gray-600">
          <Link 
            href="/" 
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}