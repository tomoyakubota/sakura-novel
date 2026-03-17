import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "桜色の約束 ─ Sakura-iro no Yakusoku",
  description: "あなたの言葉が物語を紡ぐ、AI恋愛ノベルゲーム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
