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
│   ├── ProgressDashboard.tsx  # 科目区分別進捗表示（グループ + カテゴリ階層）
│   ├── CourseSuggestion.tsx   # 履修サジェスト一覧テーブル
│   ├── TimetableGrid.tsx      # 5曜日×6時限の時間割グリッド
│   └── ModuleTab.tsx          # モジュール切替タブ（春A〜秋C）
├── lib/
│   ├── csvParser.ts           # TWINS CSV → StudentData 変換
│   ├── creditCalculator.ts    # 単位数・GPA 集計
│   ├── requirementChecker.ts  # カリキュラム要件の充足判定（グループ単位）
│   ├── courseSuggester.ts     # 4段階サジェストアルゴリズム
│   └── timetableResolver.ts   # 時間割スロット生成・衝突検出
└── types/
    └── index.ts               # 全型定義

data/
├── curricula/
│   ├── mast.json   # 情報メディア創成学類のカリキュラム定義（公式別表ベース）
│   └── mast.csv    # 同上の編集用 CSV（import-curriculum-csv.ts で JSON へ変換）
└── courses/
    ├── 2025.json   # 2025年度 科目マスタ（KdB スクレイパーで取得）
    └── 2026.json   # 2026年度 科目マスタ（現状は 2025 データを流用）

scripts/
├── fetch_kdb.py              # KdB 科目データ自動取得スクリプト
├── import-courses-csv.ts     # courses CSV → JSON 変換
├── export-courses-csv.ts     # courses JSON → CSV 変換
├── import-curriculum-csv.ts  # mast.csv → mast.json 変換
└── export-curriculum-csv.ts  # mast.json → mast.csv 変換
```

## データ設計

### カリキュラム定義 (`data/curricula/mast.json`)

公式の卒業要件別表（情報学群履修細則 別表）に基づいた JSON。
`Curriculum` 型に対応し、卒業要件を **グループ（科目区分）→ カテゴリ** の2階層で管理する。

トップレベルフィールド:

| フィールド | 説明 |
|---|---|
| `totalCreditsRequired` | 卒業必要単位数（124） |
| `annualCreditCap` | 年間履修上限（45） |
| `annualCreditCapExtended` | 拡張上限（55） |
| `promotionRequirements.year3to4.minCredits` | 3→4年進級要件（100単位） |
| `groups` | 科目区分グループ配列（後述） |

`groups` 配列の各要素 (`CurriculumGroup`):

| フィールド | 説明 |
|---|---|
| `name` | グループ名（専門科目 / 専門基礎科目 / 基礎科目（共通） / 基礎科目（関連））|
| `minCredits` | グループ全体の必要最低単位数 |
| `maxCredits` | グループ全体の上限単位数（省略可）|
| `categories` | カテゴリ配列 |

`categories` 配列の各要素 (`CurriculumCategory`):

- **`type: "required"` + `courses` 配列** — 科目番号の完全一致で判定。配列内の全科目が必修対象。
- **`type: "elective"` + `prefixes` 配列** — 科目番号の前方一致で判定。例: `"GC2"` は `GC20201` 等にマッチ。
- `minCredits` / `maxCredits` — そのカテゴリで必要な最小・最大単位数。

### 卒業要件グループ構成（公式別表ベース）

| グループ | 必修 | 選択 | 自由 | 小計(最低) |
|---|---|---|---|---|
| 専門科目 | 14単位 | 20〜35単位 | 0 | 34単位〜 |
| 専門基礎科目 | 25単位 | 31〜46単位 | 0 | 56単位〜 |
| 基礎科目（共通） | 12単位 | 1〜10単位 | 0 | 13単位〜 |
| 基礎科目（関連） | 0単位 | 6〜15単位 | 0 | 6単位〜 |
| **合計** | **51単位** | **73単位** | **0** | **124単位** |

**専門科目（必修）**: 卒業研究A/B（各3単位）、情報メディア実験A/B（各3単位）、専門英語A/B（各1単位）
**専門科目（選択）**: プレフィックス GC5, GA4
**専門基礎科目（必修）**: 微分積分A/B、線形代数A/B、情報数学A、確率と統計、プログラミング入門A/B、コンピュータリテラシー、プログラミング、コンピューターシステムとOS、データ構造とアルゴリズム（実習含む）、データ工学概論
**専門基礎科目（選択）**: プレフィックス GC2, GA1（必修指定科目を除く）

### 科目マスタ (`data/courses/2025.json`)

キーが科目番号、値が `CourseData` オブジェクトの辞書形式。
KdBスクレイパーで取得（プレフィックス GC20〜GC27, GA12〜GA18 対象）。

```jsonc
{
  "GC20201": {
    "name": "Media Sociology",   // ※現状英語名のみ
    "credits": 2.0,
    "standardYear": 1,           // 標準履修年次
    "modules": ["秋C"],          // 開講モジュール
    "dayPeriod": "月3",          // 曜日+時限
    "category": "B",             // B=専門, C=共通, C0=その他
    "prefixes": ["GC2"],         // 所属プレフィックス
    "prerequisites": [],         // 前提科目の科目番号
    "instructor": ""
  }
}
```

## 型定義 (`src/types/index.ts`)

```typescript
// 入力
GradeRecord      TWINS CSV の1行（科目番号・評価・単位数など）
StudentData      パース済み学生データ（成績一覧・GPA・不合格科目）

// カリキュラム
Curriculum         学類全体の卒業要件
CurriculumGroup    科目区分グループ（専門科目 など）
CurriculumCategory カテゴリ（専門科目（必修） など）

// 充足状況
GroupRequirementStatus  グループ単位の充足状況（categories を含む）
RequirementStatus       カテゴリ単位の充足状況

// サジェスト・時間割
SuggestedCourse    推薦科目（優先度・理由付き）
TimetableSlot      科目を時間割スロットに配置した情報
TimetableConflict  時間割上の衝突情報
```

## 処理フロー

```
CSV アップロード
  │
  ▼
parseTwinsCSV() → StudentData（成績・GPA・不合格科目を集計）
  │
  ▼
checkGroupRequirements() → GroupRequirementStatus[]（グループ＋カテゴリごとの充足状況）
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
| **CsvUploader** | ドラッグ&ドロップまたはファイル選択で TWINS CSV を読み込む |
| **ProgressDashboard** | グループ別カードで科目区分ごとの進捗を表示。グループ進捗バー（太）＋カテゴリ進捗バー（細）のネスト構成 |
| **CourseSuggestion** | サジェスト結果をテーブル表示。優先度バッジ（highest/high/medium/low）付き |
| **TimetableGrid** | 月〜金 × 1〜6限の時間割グリッド。選択中のモジュールに応じた科目を表示 |
| **ModuleTab** | 春A/春B/春C/秋A/秋B/秋C のモジュール切替タブ |

---

## 作業ログ

### 2026-03-25 実施

#### やったこと

**1. カリキュラムデータの公式別表対応**

`data/mast.png`（情報学群履修細則 別表）をユーザーが Excel に書き写した `mast_sotugyo.xlsx` を元に、
`data/curricula/mast.json` / `mast.csv` を公式別表と一致するよう全面修正。

主な変更点:
- 専門科目・必修: 10単位 → **14単位**（卒業研究A/B・実験A/B・専門英語A/B）
- 専門科目・選択プレフィックス: `GC2` → **`GC5`, `GA4`**（旧定義は誤り）
- 専門基礎科目・必修: 14単位 → **25単位**（14科目）
- 基礎科目（共通）選択を5サブカテゴリに分解（学士基盤科目・体育・外国語・国語・芸術）
- 基礎科目（関連）を3サブカテゴリに分解（他学群科目・GB/GE・博物館等）

**2. カリキュラム定義のグループ階層化**

- `mast.json` をフラットな `categories[]` から 4グループの `groups[]` 階層構造に変更
- `CurriculumGroup`, `GroupRequirementStatus` 型を追加
- `requirementChecker.ts`: `checkRequirements()` → `checkGroupRequirements()` に変更
- `ProgressDashboard.tsx`: グループカード + カテゴリ進捗バーのネスト表示に更新
- `mast.csv` フォーマットにグループ名列・グループ小計セクションを追加

**3. CSV import/export スクリプト更新**

`scripts/import-curriculum-csv.ts`, `export-curriculum-csv.ts` をグループ対応フォーマットに更新。

---

### 2026-03-21 実施

**1. 卒業要件画像の追加 (`data/mast.png`)**

情報メディア創成学類の公式卒業要件一覧表を `data/` 以下に配置。

**2. KdBスクレイパーの作成 (`scripts/fetch_kdb.py`)**

筑波大学の科目データベース KdB から科目データを自動取得するスクリプトを実装。

```bash
python3 scripts/fetch_kdb.py 2025   # 2025年度データを取得
python3 scripts/fetch_kdb.py 2026   # 2026年度データを取得（公開後）
```

**3. 2025年度科目データの取得 (`data/courses/2025.json`)**

2025年度の53科目を取得・保存。（2026年度はKdBに未登録のため2025年度で代用）

---

## TODO

### 優先度 高

- [ ] **専門基礎科目・必修の科目番号を網羅** — 微分積分B・線形代数B・確率と統計・コンピュータリテラシー・プログラミング・コンピューターシステムとOS・データ構造とアルゴリズム（実習含む）・データ工学概論の科目番号を `mast.csv` に追加（KdBで確認）
- [ ] **専門科目・必修の科目番号を追加** — 卒業研究A/B・情報メディア実験A/B・専門英語A/Bの科目番号（GC3x, GC4x 系）を特定して登録
- [ ] **基礎科目（共通）必修の科目番号整備** — 総合科目（FYS・学問への誘い）・情報・体育・外国語の科目番号を `mast.csv` に追加
- [ ] **KdBスクレイパーの日本語科目名対応** — 現状は英語名のみ取得。詳細ページから日本語名を追加取得する機能を実装
- [ ] **2026年度データの取得** — KdBに2026年度が登録され次第 `python3 scripts/fetch_kdb.py 2026` を実行

### 優先度 中

- [ ] **3・4年次科目（GC3x/GC4x/GC5x）をコースマスタに追加** — 専門科目選択（GC5, GA4）が機能するために必要
- [ ] **GA4x コースのスクレイプ** — 専門科目選択カテゴリのプレフィックスが GA4 のため、KdB から取得対象に追加
- [ ] **前提科目の自動取得** — シラバスの「前提科目」欄からprerequisitesを自動設定

### 優先度 低

- [ ] **他学群・他学類への対応** — `mast.json` を学類IDで切り替えられるよう拡張
- [ ] **単位互換のサポート** — 同一授業の複数科目番号対応
