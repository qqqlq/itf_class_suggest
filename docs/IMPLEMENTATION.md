# 実装ドキュメント

筑波大学 情報メディア創成学類の履修計画サジェストツール。
TWINS の成績 CSV をアップロードすると、卒業要件の充足状況を可視化し、次年度の履修科目を自動提案する。

## 技術スタック

- **Next.js 15** (App Router) + **React 18** + **TypeScript 5**
- **Tailwind CSS v4** (`@tailwindcss/postcss`)
- **Papa Parse** — TWINS CSV のパース
- 全処理クライアントサイド完結（バックエンド不要）

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # メインページ（各コンポーネントを統合）
│   ├── globals.css         # グローバルスタイル
│   └── favicon.ico
├── components/
│   ├── CsvUploader.tsx     # CSV アップロード UI（D&D / ファイル選択）
│   ├── ProgressDashboard.tsx  # 取得単位・GPA・カテゴリ別進捗表示
│   ├── CourseSuggestion.tsx   # 履修サジェスト一覧テーブル
│   ├── TimetableGrid.tsx      # 5曜日×6時限の時間割グリッド
│   └── ModuleTab.tsx          # モジュール切替タブ（春A〜秋C）
├── lib/
│   ├── csvParser.ts        # TWINS CSV → StudentData 変換
│   ├── creditCalculator.ts # 単位数・GPA 集計
│   ├── requirementChecker.ts  # カリキュラム要件の充足判定
│   ├── courseSuggester.ts     # 4段階サジェストアルゴリズム
│   └── timetableResolver.ts   # 時間割スロット生成・衝突検出
└── types/
    └── index.ts            # 全型定義

data/
├── curricula/
│   └── mast.json           # 情報メディア創成学類のカリキュラム定義
└── courses/
    └── 2026.json           # 2026年度 科目マスタ
```

## データ設計

### カリキュラム定義 (`data/curricula/mast.json`)

`Curriculum` 型に対応する JSON。学類全体の卒業要件と、カテゴリごとの必要単位・科目リストを定義する。

トップレベルフィールド:

| フィールド | 説明 |
|---|---|
| `totalCreditsRequired` | 卒業必要単位数（124） |
| `annualCreditCap` | 年間履修上限（45） |
| `annualCreditCapExtended` | 拡張上限（55） |
| `promotionRequirements.year3to4.minCredits` | 3→4年進級要件（100単位） |
| `categories` | カテゴリ配列（後述） |

`categories` 配列の各要素 (`CurriculumCategory`):

- **`type: "required"` + `courses` 配列** — 科目番号の完全一致で判定。配列内の全科目が必修対象。
- **`type: "elective"` + `prefixes` 配列** — 科目番号の前方一致で判定。例: `"GC2"` は `GC20201`, `GC21101` 等にマッチ。
- `minCredits` / `maxCredits` — そのカテゴリで必要な最小・最大単位数。

### 科目マスタ (`data/courses/2026.json`)

キーが科目番号、値が `CourseData` オブジェクトの辞書形式。

```jsonc
{
  "GC20201": {
    "name": "線形代数B",
    "credits": 2.0,
    "standardYear": 2,       // 標準履修年次
    "modules": ["春A", "春B"], // 開講モジュール
    "dayPeriod": "月1",       // 曜日+時限
    "category": "B",          // B=専門, C=共通, C0=その他
    "prefixes": ["GC2"],      // 所属プレフィックス
    "prerequisites": ["GA15231"], // 前提科目の科目番号
    "instructor": ""
  }
}
```

## 処理フロー

```
CSV アップロード
  │
  ▼
parseTwinsCSV() → StudentData（成績・GPA・不合格科目を集計）
  │
  ▼
checkRequirements() → RequirementStatus[]（カテゴリごとの充足状況）
  │
  ▼
suggestCourses() → SuggestedCourse[]（4段階アルゴリズムで科目推薦）
  │
  ▼
buildTimetableSlots() + detectConflicts() → 時間割グリッドに配置・衝突検出
```

## サジェストアルゴリズム

`suggestCourses()` は4つのフェーズを順に実行し、優先度付きの履修候補リストを生成する。
各フェーズで科目を追加する際、`buildTimetableSlots()` + `hasConflict()` で時間割衝突がないことを確認する。

### Phase 1: 必修科目（priority: `highest`）

`RequirementStatus.missingCourses` から、`standardYear <= targetYear` の未取得必修科目を全て追加。

### Phase 2: 不合格科目の再履修（priority: `high`）

`StudentData.failedCourses`（D評価）に該当する科目を再履修候補として追加。

### Phase 3: 選択科目のカテゴリ充足（priority: `medium`）

未充足の選択カテゴリを「残り必要単位数が大きい順」にソートし、各カテゴリでプレフィックスマッチする科目を `standardYear` 昇順で追加。`minCredits` に達したら次のカテゴリへ。

### Phase 4: 単位数確保（priority: `low`）

サジェスト合計が40単位未満の場合、`targetYear` の未追加科目を単位数降順で追加して40単位以上を確保する。合計が45単位を超える場合は呼び出し側で警告を表示。

## コンポーネント構成

| コンポーネント | 役割 |
|---|---|
| **CsvUploader** | ドラッグ&ドロップまたはファイル選択で TWINS CSV を読み込み、`parseTwinsCSV()` を呼び出す |
| **ProgressDashboard** | 取得単位数・GPA のサマリカード、カテゴリ別プログレスバー、不合格科目のアラート表示 |
| **CourseSuggestion** | サジェスト結果をテーブル表示。優先度バッジ（highest/high/medium/low）付き |
| **TimetableGrid** | 月〜金 × 1〜6限の時間割グリッド。選択中のモジュールに応じた科目を表示 |
| **ModuleTab** | 春A/春B/春C/秋A/秋B/秋C のモジュール切替タブ |

## 既知の制限事項

- 科目番号・曜日時限は時間割画像からの手動読み取りのため、一部推定値を含む
- カリキュラムの卒業要件（`mast.json`）は暫定データであり、正式な学類要覧との差異がありうる
- 3・4年次配当科目は科目マスタ（`2026.json`）に未登録
- 共通科目（基礎科目）・自由科目のカバレッジが不完全

---

## 作業ログ

### 2026-03-21 実施

#### やったこと

**1. 卒業要件画像の追加 (`data/mast.png`)**

情報メディア創成学類の公式卒業要件一覧表（`mast.png`）を `data/` 以下に配置。
既存の `data/curricula/mast.csv` / `mast.json` との照合を実施。

照合で判明した暫定データの問題点:
- `専門科目（必修）`: `minCredits=10` だが列挙された3科目(GC27202, GC27302, GC27402)の確認単位合計は4単位。GC27402が `courses/2026.json` に存在しない
- `情報学群共通専門基礎科目`: 14科目を列挙しているが単位合計は20単位（`minCredits=14` と不一致）
- → **ユーザーが `mast.png` と見比べながら `mast.csv` を手修正予定**

**2. KdBスクレイパーの作成 (`scripts/fetch_kdb.py`)**

筑波大学の科目データベース KdB (<https://kdb.tsukuba.ac.jp/>) から科目データを自動取得するスクリプトを実装。

- KdBのAJAX API (`POST /`, `action=search`) をリバースエンジニアリング
- 科目番号プレフィックス単位で検索 (GC20〜GC27, GA12〜GA18)
- HTMLレスポンスをパースして `data/courses/<year>.json` 形式に変換

```bash
python3 scripts/fetch_kdb.py 2025   # 2025年度データを取得
python3 scripts/fetch_kdb.py 2026   # 2026年度データを取得（公開後）
```

**3. 2025年度科目データの取得 (`data/courses/2025.json`)**

上記スクレイパーで2025年度の53科目を取得・保存。
（2026年度はKdBに未登録のため2025年度で代用）

---

## TODO

### 優先度 高

- [ ] **`mast.csv/json` の修正** — `mast.png` と照合してカテゴリ定義・必要単位数を正確に更新
  - GC27402の正式科目名・単位数の確認
  - `情報学群共通専門基礎科目` のminCreditsが14か20かの確認
- [ ] **KdBスクレイパーの日本語科目名対応** — 現状は英語名のみ取得。各科目の詳細ページ（`action=showCourseDetail`）から日本語名を追加取得する機能を実装
- [ ] **2026年度データの取得** — KdBに2026年度が登録され次第 `python3 scripts/fetch_kdb.py 2026` を実行し `data/courses/2026.json` を更新

### 優先度 中

- [ ] **3・4年次科目の追加** — KdBからGC3x/GC4x系科目も取得してマスタに追加
- [ ] **共通科目の追加** — 体育・英語・FYS等の共通科目（C区分）をマスタに追加
- [ ] **前提科目の自動取得** — シラバスの「前提科目」欄からprerequisitesを自動設定
- [ ] **`data/courses/2026.json` の精査** — 手動作成データとKdBデータを比較し差分を解消

### 優先度 低

- [ ] **他学群・他学類への対応** — `mast.json` を学類IDで切り替えられるよう拡張
- [ ] **単位互換のサポート** — GC20101/GE21401 のような同一授業の複数科目番号対応
