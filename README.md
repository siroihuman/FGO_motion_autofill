# FGO Motion Autofill

[@wiki版 FGOモーションテンプレート](https://w.atwiki.jp/siroi_human/pages/337.html) を参考に、入力フォームから貼り付け用の@wiki記法を自動生成するツールです。

## 主な機能

- Battle Character（第1～第3段階）の入力
- スキル使用1～3の入力
- Buster / Arts / Quick 各1～3の入力
- EX / 宝具モーションを必要数だけ追加
- 各モーションのHit数を複数行で入力
- モーションの各工程とHit数を行単位で対応
- Hit数へ `Hit` を自動付与（`2` → `2Hit`、`1+2` → `1+2Hit`）
- 通常モーション1つ＋差分モーション最大2つを生成
- スキル・Q/A/Bは通常/差分とも未入力行を自動省略
- 差分モーションでは未入力のBattle Character行も自動省略
- `#region(close,...)` 形式の@wikiモーション表を生成
- 生成結果のクリップボードコピー
- `localStorage` を利用した入力内容の保存・復元

## @wikiへの導入

1. @wikiで、この機能を置く専用ページを作成します。
2. そのページの編集権限を「管理者のみ編集可能」にします。
3. `atwiki_paste.txt` の内容をページへそのまま貼り付けます。
4. ページを保存すると入力フォームが表示されます。

## 出力形式

通常モーション・差分モーションとも、次の4列形式で生成します。

```text
#region(close,モーション一覧)
|BGCOLOR(#F5FFFA):CENTER:110|BGCOLOR(#F5FFFA):CENTER:40|BGCOLOR(#F5FFFA):LEFT:1000|BGCOLOR(#F5FFFA):CENTER:65|c
|>|>|>|BGCOLOR(#E6E6FA):CENTER:Battle Character|
...
|>|>|BGCOLOR(#E6E6FA):CENTER:Battle Motion|BGCOLOR(#E6E6FA):CENTER:Hit|
...
#endregion()
```

## 未入力行の扱い

スキル使用1～3、Buster / Arts / Quick 1～3は、通常モーションでも差分モーションでも未入力行を生成しません。

たとえばBuster 2だけ入力されている場合は、次のようにBuster 2だけが生成されます。

```text
|Buster|2|...|...|
```

差分ではBattle Characterも未入力行を削除します。差分全体が完全に空の場合、その差分ブロック自体を生成しません。

## EX・宝具の複数モーション

EX・宝具はフォーム内の「EXを追加」「宝具を追加」ボタンで必要数だけ増やせます。空欄の追加枠は生成数に含めません。

### 1件だけ入力した場合

```text
|>|EX|モーション|Hit|
|>|宝具|モーション|Hit|
```

### 2件以上入力した場合

```text
|EX|1|モーション1|Hit|
|~|2|モーション2|Hit|
|~|3|モーション3|Hit|

|宝具|1|モーション1|Hit|
|~|2|モーション2|Hit|
```

入力枠の番号に欠番があっても、生成時は実際に入力された内容だけを `1`、`2`、`3`…と連番で出力します。

## Hit入力

モーション欄とHit欄は同じ行番号同士が対応します。

モーション欄：

```text
接近する
斬りつける
魔力を放つ
```

Hit欄：

```text

2
3
```

生成例：

```text
接近する →&br()斬りつける →&br()魔力を放つ
&br()2Hit&br()3Hit
```

`Hit` は自動付与されます。すでに `Hit` を付けて入力した場合は重複しません。

## 保存データ

EX・宝具の追加枠も `localStorage` に保存・復元します。v1.2以前で保存した単一EX・単一宝具のデータは、初回枠へ自動移行します。

## ファイル

- `atwiki_paste.txt` — @wikiへ直接貼り付ける完成コード
- `motion_autofill.js` — JavaScript本体
- `standalone_preview.html` — PC上でフォームを確認するための簡易テストページ
- `README.md` — 説明書

## バージョン

- v1.3 — 通常モーションでも未入力スキル・Q/A/B行を省略、EX・宝具の複数モーション追加と自動連番出力に対応
- v1.2 — 差分を最大2つへ変更、差分未入力行の省略、`#region` ベースの指定モーション表形式へ変更
- v1.1 — 差分モーション最大3つ、複数Hit入力、モーション行とHit行の対応、`Hit` 自動付与に対応
- v1.0 — 初版