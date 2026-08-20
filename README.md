# FGO Motion Autofill

[@wiki版 FGOモーションテンプレート](https://w.atwiki.jp/siroi_human/pages/337.html) を参考に、入力フォームから貼り付け用の@wiki記法を自動生成するツールです。

## 主な機能

- Battle Character（第1～第3段階）の入力
- スキル使用1～3の入力
- Buster / Arts / Quick 各1～3、EX、宝具モーションの入力
- 各モーションのHit数を複数行で入力
- モーションの各工程とHit数を行単位で対応
- Hit数へ `Hit` を自動付与（`2` → `2Hit`、`1+2` → `1+2Hit`）
- 通常モーション1つ＋差分モーション最大2つを生成
- 差分モーションでは未入力の行を自動的に省略
- `#region(close,...)` 形式の@wikiモーション表を生成
- 生成結果のクリップボードコピー
- `localStorage` を利用した入力内容の保存・復元

## @wikiへの導入

1. @wikiで、この機能を置く専用ページを作成します。
2. そのページの編集権限を「管理者のみ編集可能」にします。
3. `atwiki_paste.txt` の内容をページへそのまま貼り付けます。
4. ページを保存すると入力フォームが表示されます。

## 出力形式

通常モーションは、ページ337系の次の形式で出力します。

```text
#region(close,モーション一覧)
|BGCOLOR(#F5FFFA):CENTER:110|BGCOLOR(#F5FFFA):CENTER:40|BGCOLOR(#F5FFFA):LEFT:1000|BGCOLOR(#F5FFFA):CENTER:65|c
|>|>|>|BGCOLOR(#E6E6FA):CENTER:Battle Character|
...
|>|>|BGCOLOR(#E6E6FA):CENTER:Battle Motion|BGCOLOR(#E6E6FA):CENTER:Hit|
...
#endregion()
```

## 差分モーション

通常モーションに加えて差分を最大2つまで生成できます。差分では未入力項目を `－` に置き換えず、該当行自体を出力しません。

たとえばBattle Characterで第3段階だけ入力した場合、第1・第2段階の行は生成されません。

カードモーションも同様で、たとえばBuster 2だけ入力されている場合は `Buster|2` が先頭行として生成され、存在しないBuster 1の行や不正な `~` は生成されません。

差分の入力が完全に空の場合、その差分ブロック自体を生成しません。

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

## ファイル

- `atwiki_paste.txt` — @wikiへ直接貼り付ける完成コード
- `motion_autofill.js` — JavaScript本体
- `standalone_preview.html` — PC上でフォームを確認するための簡易テストページ
- `README.md` — 説明書

## バージョン

- v1.2 — 差分を最大2つへ変更、差分未入力行の省略、`#region` ベースの指定モーション表形式へ変更
- v1.1 — 差分モーション最大3つ、複数Hit入力、モーション行とHit行の対応、`Hit` 自動付与に対応
- v1.0 — 初版
