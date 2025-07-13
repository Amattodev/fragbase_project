# Ubuntu版のNode.js（Alpine Linuxの互換性問題を回避）
FROM node:20-slim

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションコードをコピー
COPY . .

# .open-nextディレクトリを削除（権限問題を回避）
RUN rm -rf .open-next || true

# workerdバイナリに実行権限を付与
RUN chmod +x /app/node_modules/@cloudflare/workerd-linux-64/bin/workerd || true


# Wrangler開発サーバー用ポートを公開
EXPOSE 8787

# 環境変数を設定
ENV NEXTJS_ENV=development

# Wrangler開発サーバーを起動
CMD ["sh", "-c", "rm -rf .open-next && npm run preview"]
