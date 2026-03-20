# 履修計画サジェストツール

筑波大学の学生が TWINS から出力した成績 CSV をアップロードするだけで、次年度の履修科目サジェストを受けられる Web アプリ。初期は情報メディア創成学類向け。

## 機能

- **成績 CSV 取り込み** — TWINS の成績 CSV をドラッグ&ドロップまたはファイル選択でアップロード
- **卒業要件チェック** — カテゴリ別の取得単位数をプログレスバーで可視化
- **科目サジェスト** — 必修・再履修・選択の優先度付きで次年度科目を自動提案（40 単位以上を確保）
- **時間割表示** — 月〜金 × 1〜6 限のグリッドにサジェスト科目を配置（モジュール切替対応）

## 技術スタック

| 種別 | 技術 |
|------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| CSV 解析 | Papa Parse |
| デプロイ | Vercel（静的エクスポート可） |

バックエンド・DB 不要。全処理をクライアントサイドで完結。

## セットアップ

```bash
npm install
npm run dev
```

`http://localhost:3000` を開き、TWINS からダウンロードした成績 CSV をアップロードする。

## データ管理

カリキュラム定義と科目マスタは `data/` 以下の JSON ファイルで管理する。
CSV 経由で表計算ソフトから編集できるスクリプトを用意している。

```bash
# JSON → CSV にエクスポート（Excel / Google Sheets で編集）
npm run data:export

# 編集した CSV → JSON にインポート
npm run data:import
```

| ファイル | 内容 |
|---------|------|
| `data/curricula/mast.json` | 情報メディア創成学類の卒業要件定義 |
| `data/courses/2026.json` | 2026 年度科目マスタ（科目番号・単位・曜時限など） |

詳細は [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) を参照。

## ディレクトリ構成

```
src/
├── app/          # Next.js App Router
├── components/   # UI コンポーネント
├── lib/          # ビジネスロジック（CSV パース・要件チェック・サジェスト）
└── types/        # 型定義

data/
├── curricula/    # 学類別カリキュラム定義 JSON
└── courses/      # 年度別科目マスタ JSON

scripts/          # データ変換スクリプト（CSV ↔ JSON）
docs/             # 実装ドキュメント
itf_risyu_docs/   # 参考資料（時間割画像・成績 CSV サンプル等）
```
