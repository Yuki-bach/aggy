#!/usr/bin/env python3
"""Aggy レイアウトJSON バリデーター

Usage:
    python validate_layout.py <layout.json> [--csv <rawdata.csv>]

layout.schema.json に基づいてレイアウトJSONを検証する。
--csv を指定すると、CSVヘッダーとの整合性もチェックする。
"""
import json
import csv
import sys
import os


def validate_layout(layout: list, schema_path: str | None = None) -> list[str]:
    """レイアウトJSONをスキーマルールに基づいて検証する。"""
    errors = []

    if not isinstance(layout, list):
        return ["ルート要素がJSON配列ではありません"]

    if len(layout) == 0:
        return ["レイアウトが空です"]

    seen_keys = set()

    for i, entry in enumerate(layout):
        prefix = f"[{i}]"

        if not isinstance(entry, dict):
            errors.append(f"{prefix}: オブジェクトではありません")
            continue

        # key: 必須、文字列
        key = entry.get("key")
        if key is None:
            errors.append(f"{prefix}: 'key' がありません")
        elif not isinstance(key, str) or not key:
            errors.append(f"{prefix}: 'key' が空または文字列ではありません")
        else:
            if key in seen_keys:
                errors.append(f"{prefix}: key '{key}' が重複しています")
            seen_keys.add(key)

        # type: 必須、SA/MA/WEIGHT/DATE
        typ = entry.get("type")
        valid_types = {"SA", "MA", "WEIGHT", "DATE"}
        if typ is None:
            errors.append(f"{prefix}: 'type' がありません")
            continue
        elif typ not in valid_types:
            errors.append(f"{prefix}: type '{typ}' は無効です（有効: {valid_types}）")
            continue

        # 許可されるフィールドのチェック
        allowed = {"key", "type", "label", "items", "granularity"}
        extra = set(entry.keys()) - allowed
        if extra:
            errors.append(f"{prefix}: 不明なフィールド: {extra}")

        # 型別ルール
        if typ in ("SA", "MA"):
            _validate_sa_ma(entry, prefix, typ, errors)
        elif typ == "WEIGHT":
            _validate_weight(entry, prefix, errors)
        elif typ == "DATE":
            _validate_date(entry, prefix, errors)

    return errors


def _validate_sa_ma(entry: dict, prefix: str, typ: str, errors: list):
    """SA/MA共通の検証。"""
    items = entry.get("items")
    if items is None:
        errors.append(f"{prefix}: {typ} には 'items' が必須です")
        return
    if not isinstance(items, list):
        errors.append(f"{prefix}: 'items' が配列ではありません")
        return
    if len(items) == 0:
        errors.append(f"{prefix}: 'items' が空です（1つ以上必要）")
        return

    seen_codes = set()
    for j, item in enumerate(items):
        ip = f"{prefix}.items[{j}]"
        if not isinstance(item, dict):
            errors.append(f"{ip}: オブジェクトではありません")
            continue

        # code: 必須、文字列
        code = item.get("code")
        if code is None:
            errors.append(f"{ip}: 'code' がありません")
        elif not isinstance(code, str):
            errors.append(f"{ip}: 'code' が文字列ではありません（値: {code!r}, 型: {type(code).__name__}）")
        else:
            if code in seen_codes:
                errors.append(f"{ip}: code '{code}' が重複しています")
            seen_codes.add(code)

        # label: 必須、文字列
        label = item.get("label")
        if label is None:
            errors.append(f"{ip}: 'label' がありません")
        elif not isinstance(label, str):
            errors.append(f"{ip}: 'label' が文字列ではありません")

        # 余分なフィールド
        extra = set(item.keys()) - {"code", "label"}
        if extra:
            errors.append(f"{ip}: 不明なフィールド: {extra}")


def _validate_weight(entry: dict, prefix: str, errors: list):
    """WEIGHT型の検証。"""
    if "items" in entry:
        errors.append(f"{prefix}: WEIGHT に 'items' は不要です")
    if "granularity" in entry:
        errors.append(f"{prefix}: WEIGHT に 'granularity' は不要です")


def _validate_date(entry: dict, prefix: str, errors: list):
    """DATE型の検証。"""
    if "items" in entry:
        errors.append(f"{prefix}: DATE に 'items' は不要です")

    gran = entry.get("granularity")
    valid_gran = {"year", "month", "week", "day"}
    if gran is None:
        errors.append(f"{prefix}: DATE には 'granularity' が必須です")
    elif gran not in valid_gran:
        errors.append(f"{prefix}: granularity '{gran}' は無効です（有効: {valid_gran}）")


def check_csv_consistency(layout: list, csv_path: str) -> list[str]:
    """CSVヘッダーとレイアウトJSONの整合性をチェックする。"""
    errors = []

    with open(csv_path, encoding="utf-8") as f:
        reader = csv.reader(f)
        headers = next(reader)

    header_set = set(headers)
    expected = set()

    for entry in layout:
        typ = entry.get("type")
        key = entry.get("key", "")

        if typ in ("SA", "WEIGHT", "DATE"):
            expected.add(key)
            if key not in header_set:
                errors.append(f"レイアウトの key '{key}' ({typ}) がCSVヘッダーにありません")

        elif typ == "MA":
            for item in entry.get("items", []):
                col = f"{key}_{item['code']}"
                expected.add(col)
                if col not in header_set:
                    errors.append(f"MA列 '{col}' がCSVヘッダーにありません")

    extra = header_set - expected
    if extra:
        errors.append(f"レイアウト未定義のCSV列があります: {sorted(extra)}")

    return errors


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    layout_path = sys.argv[1]
    csv_path = None

    if "--csv" in sys.argv:
        idx = sys.argv.index("--csv")
        if idx + 1 < len(sys.argv):
            csv_path = sys.argv[idx + 1]

    # レイアウトJSON読み込み
    try:
        with open(layout_path, encoding="utf-8") as f:
            layout = json.load(f)
    except json.JSONDecodeError as e:
        print(f"FAIL: JSONパースエラー: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"FAIL: ファイルが見つかりません: {layout_path}")
        sys.exit(1)

    # スキーマバリデーション
    errors = validate_layout(layout)

    # CSV整合性チェック
    csv_errors = []
    if csv_path:
        try:
            csv_errors = check_csv_consistency(layout, csv_path)
        except FileNotFoundError:
            csv_errors = [f"CSVファイルが見つかりません: {csv_path}"]

    all_errors = errors + csv_errors

    if all_errors:
        print(f"FAIL: {len(all_errors)} 件のエラー")
        for e in all_errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        # サマリー
        type_counts = {}
        for entry in layout:
            t = entry.get("type", "?")
            type_counts[t] = type_counts.get(t, 0) + 1
        summary = ", ".join(f"{t} x{c}" for t, c in sorted(type_counts.items()))
        print(f"OK: {len(layout)} エントリ ({summary})")
        if csv_path:
            print(f"OK: CSV整合性チェック通過")
        sys.exit(0)


if __name__ == "__main__":
    main()
