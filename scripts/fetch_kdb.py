#!/usr/bin/env python3
"""
KdB（筑波大学科目データベース）から科目データを取得するスクリプト。
対象: GC2xxx / GA1xxx / GC27xxx（情報メディア創成学類）
出力: data/courses/<year>.json
"""

import json
import re
import sys
import time
import requests
from pathlib import Path

BASE_URL = "https://kdb.tsukuba.ac.jp/"
HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
}

# 取得対象の科目番号プレフィックス（txtSyllabus検索に使用）
# 細かく分けることでヒット数を絞り、ページネーションを安定させる
TARGET_PREFIXES = [
    "GC10", "GC11", "GC12", "GC13",                                    # 専門基礎（必修）
    "GC20", "GC21", "GC22", "GC23", "GC24", "GC25", "GC26", "GC27",   # 専門基礎（選択）
    "GC50", "GC51", "GC52", "GC53", "GC54", "GC55",                    # 専門科目（選択）
    "GA12", "GA13", "GA14", "GA15", "GA18",                            # 情報学群共通
]


def parse_courses(html: str) -> dict:
    """HTMLテーブル文字列から科目データを辞書として返す。"""
    courses = {}
    tables = re.findall(
        r'<table[^>]* e="([A-Z0-9]+)"[^>]*>(.*?)</table>',
        html,
        re.DOTALL,
    )
    for code, content in tables:
        if not re.match(r'^(GC1|GC2|GC5|GA1)', code):
            continue

        tds = re.findall(r'<td[^>]*>(.*?)</td>', content, re.DOTALL)
        texts = [re.sub(r'<[^>]+>', '', t) for t in tds]
        texts = [re.sub(r'\s+', ' ', t).strip() for t in texts]

        # フィールド順: code, name(en), year, credits, ?, term, day_period, instructor, keywords, notes, flag
        if len(texts) < 7:
            continue

        credits_raw = texts[3] if len(texts) > 3 else "0"
        try:
            credits = float(credits_raw)
        except ValueError:
            credits = 0.0

        std_year_raw = texts[2] if len(texts) > 2 else "0"
        try:
            std_year = int(std_year_raw)
        except ValueError:
            std_year = 0

        term_raw = texts[5] if len(texts) > 5 else ""
        day_period_raw = texts[6] if len(texts) > 6 else ""
        instructor = texts[7] if len(texts) > 7 else ""

        # タームのパース (SprAB -> ["春A","春B"] 等)
        modules = parse_modules(term_raw)
        # 曜日・時限のパース (Mon/Thu3,4 -> "月3")
        day_period = parse_day_period(day_period_raw)

        # カテゴリ判定
        category = "B" if code.startswith(("GC", "GA")) else "C"

        prefixes = []
        if re.match(r'^GC1', code):
            prefixes.append("GC1")
        elif re.match(r'^GC2', code):
            prefixes.append("GC2")
        elif re.match(r'^GC5', code):
            prefixes.append("GC5")
        if re.match(r'^GA1', code):
            prefixes.append("GA1")

        courses[code] = {
            "name": texts[1],
            "credits": credits if credits != int(credits) else int(credits),
            "standardYear": std_year,
            "modules": modules,
            "dayPeriod": day_period,
            "category": category,
            "prefixes": prefixes,
            "prerequisites": [],
            "instructor": instructor,
        }

    return courses


def parse_modules(term_raw: str) -> list:
    """'SprAB', 'FallC', 'SprA' 等を ['春A','春B'] 等に変換。"""
    mapping = {
        "Spr": "春", "Fall": "秋",
        "A": "A", "B": "B", "C": "C",
    }
    # 複数ある場合はカンマ区切り
    parts = [t.strip() for t in term_raw.split(",")]
    result = []
    for part in parts:
        m = re.match(r'(Spr|Fall)([ABC]+)', part)
        if m:
            season = "春" if m.group(1) == "Spr" else "秋"
            for ch in m.group(2):
                result.append(f"{season}{ch}")
        elif part:
            result.append(part)
    return result


def parse_day_period(dp_raw: str) -> str:
    """'Mon/Thu3,4' -> '月3' （最初の曜日・時限のみ）"""
    day_map = {
        "Mon": "月", "Tue": "火", "Wed": "水",
        "Thu": "木", "Fri": "金", "Sat": "土",
    }
    m = re.match(r'([A-Za-z]+)/?\S*?(\d)', dp_raw)
    if m:
        day_en = m.group(1)
        period = m.group(2)
        day_ja = day_map.get(day_en, day_en)
        return f"{day_ja}{period}"
    return dp_raw


def fetch_courses(session: requests.Session, fy: int, prefix: str) -> dict:
    """指定プレフィックスの全科目を（ページネーション込みで）取得。"""
    all_courses = {}
    page = 0
    total = -1

    while True:
        payload = {
            "pageId": "SB0070",
            "action": "search",
            "txtFy": str(fy),
            "cmbTerm": "",
            "cmbDay": "",
            "cmbPeriod": "",
            "hdnOrg": "",
            "hdnReq": "",
            "hdnFac": "",
            "hdnDepth": "",
            "chkSyllabi": "false",
            "chkAuditor": "false",
            "chkExchangeStudent": "false",
            "chkConductedInEnglish": "false",
            "txtSyllabus": prefix,
            "reschedule": "true" if page == 0 else "false",
            "page": str(page),
            "total": str(total),
        }

        resp = session.post(BASE_URL, data=payload, headers=HEADERS)
        resp.raise_for_status()

        data = json.loads(resp.text, strict=False)

        if data.get("message") or data.get("total", 0) == 0:
            break

        total = int(data["total"])
        courses = parse_courses(data["list"])
        all_courses.update(courses)

        print(f"  prefix={prefix} page={page}: {len(courses)}件取得（累計{len(all_courses)}/{total}）")

        if not data.get("next"):
            break

        page += 1
        time.sleep(0.5)

    return all_courses


def main():
    fy = int(sys.argv[1]) if len(sys.argv) > 1 else 2025
    out_path = Path(__file__).parent.parent / "data" / "courses" / f"{fy}.json"

    print(f"KdBから{fy}年度の科目データを取得します...")

    session = requests.Session()
    # セッション確立
    session.get(BASE_URL, headers={"User-Agent": "Mozilla/5.0"})

    all_courses = {}
    for prefix in TARGET_PREFIXES:
        print(f"プレフィックス '{prefix}' を検索中...")
        courses = fetch_courses(session, fy, prefix)
        all_courses.update(courses)
        time.sleep(1)

    print(f"\n合計 {len(all_courses)} 科目を取得しました。")

    # ソートして保存
    sorted_courses = dict(sorted(all_courses.items()))
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(sorted_courses, f, ensure_ascii=False, indent=2)

    print(f"保存先: {out_path}")

    # 取得結果サマリー
    print("\n--- 取得科目一覧 ---")
    for code, c in sorted_courses.items():
        print(f"  {code}: {c['name']} ({c['credits']}単位, {c['modules']})")


if __name__ == "__main__":
    main()
