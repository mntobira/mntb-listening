# ElevenLabs 有料契約の証拠（利用者提供・2026-09-29）

利用者が送ってきた Gmail の領収書スクリーンショット。カード番号は下4桁のみ表示。

| ファイル | 内容 |
|---|---|
| elevenlabs_receipt_creator_2026-09-20.png | Eleven Labs Inc. 領収書 #2084-3643-1031、Creator (per subscription) $12.10（9月20日） |
| elevenlabs_receipt_starter_2026-09-28.png | 領収書 #2495-9775-3869、Starter (per subscription) $6.00（期間 Sep 28–Oct 28, 2026）、Paid September 28, 2026、$6.60 |
| elevenlabs_receipt_usage_2026-09-29.png | 領収書 #2466-8389-4576、$12.10 Paid September 29, 2026。Sep 28–Sep 29 の Subscription Credit Usage 16,386・Rollover 806 |

## 何が言えるか
- 2026-09-20〜09-29 に ElevenLabs の有料プラン（Starter / Creator）が支払い済みで、9/28〜9/29 にサブスクリプションのクレジットを使って生成していた。
- ElevenLabs の利用規約では、有料プランで生成した音声は商用利用できる（無料プランは帰属表示が必要・商用不可）。
- 台帳（scripts/data/listening_audio_ledger.json）の license 欄の「契約画面の証拠は未確認」は、この領収書で裏付けられた。

## 言えないこと
- 領収書は支払いの証明で、個々の音声ファイルがこのアカウントで生成されたことまでは示さない（ファイル名の ElevenLabs 既定名・日時・声の名前が一致することが傍証）。
- 規約は改定されうる。公開前に https://elevenlabs.io/terms を確認すること。
