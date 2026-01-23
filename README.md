# api.aviutl2.jp

<small>メンテナー：<a href="https://github.com/sevenc-nanashi">@sevenc-nanashi</a></small>

AviUtl2のダウンロードリンクを提供するAPIです。

## API

### `GET /versions`

AviUtl2の利用可能なバージョン一覧を取得します。

### `GET /versions/latest`

最新バージョンのAviUtl2のダウンロードリンクを取得します。

### `GET /versions/{version}`

指定したバージョンのAviUtl2のダウンロードリンクを取得します。

### `GET /download`

**クエリパラメーター：**

- `version`（必須）：ダウンロードするAviUtl2のバージョン、または`latest`。
- `type`（必須）：ダウンロードするファイルの種類。`installer`（インストーラー）または`zip`（ZIPアーカイブ）。

AviUtl2の指定したバージョンと種類のダウンロードリンクにリダイレクトします。

### `GET /openapi.json`

OpenAPI仕様書を取得します。

## ライセンス

このプロジェクトはMITライセンスでライセンスされています。詳細については、[LICENSE](LICENSE)ファイルを参照してください。
