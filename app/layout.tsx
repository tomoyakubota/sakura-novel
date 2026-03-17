export const metadata = {
  title: '桜色の約束',
  description: 'AI恋愛ノベルゲーム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
