# Guidelines

This document defines the project's rules, objectives, and progress management methods. Please proceed with the project according to the following content.

---

# Project Information

## プロジェクト概要

**プロジェクト名**: Medi_Q（メディキュー）
**正式名称**: Medi_Q - QRコード来院者管理システム
**開始日**: 2025-11-14
**現在のステータス**: 🔵 企画・要件定義フェーズ

### 目的
医療施設向けQRコード来院者管理システムの開発。磁気カードの老朽化問題を解決し、QRコードによる効率的な受付・案内システムを構築する。

### 主要機能
1. **QRコード受付システム** - 診察券のQRコードをスキャンして来院者情報を取得
2. **音声案内機能** - 診察科・待機場所・担当医などの情報を電子音声で案内
3. **診察情報印刷** - 来院者の診察情報を紙に印字
4. **カレンダー連携** - Googleカレンダーから診察予定を取得・来院通知を送信

### 想定される技術スタック（検討中）
- **フロントエンド**: Next.js + React + TypeScript（検討中）
- **カレンダー連携**: Google Calendar API / Google Apps Script（検討中）
- **QRコード読取**: Webカメラ + jsQR等のライブラリ（検討中）
- **音声合成**: VOICEVOX / softalk / Zundamon等（検討中）
- **印刷**: ブラウザ印刷機能 / サーマルプリンタAPI（検討中）

### プロジェクト構造
- `.tmp/` - 設計ドキュメント（requirements, design, test_design, tasks）
- `reports/` - 進捗レポート（HTML/MD形式）
- `.claude/` - プロジェクト設定・スラッシュコマンド

### 現在のフェーズ
**Phase 1（企画・要件定義）**: 🔵 進行中
**Phase 2（基本設計・技術選定）**: ⚪ 未開始
**Phase 3（詳細設計）**: ⚪ 未開始
**Phase 4（開発）**: ⚪ 未開始
**Phase 5（テスト）**: ⚪ 未開始
**Phase 6（デプロイ・本番稼働）**: ⚪ 未開始

### 進捗管理
- 進捗レポートは `reports/progress_report_YYYYMMDD.md` 形式で保存
- タスク管理: `.tmp/tasks.md` + `.claude/tasks.json`

### 重要な注意事項
- `.tmp/`フォルダ内のファイルがMedi_Qプロジェクトの実際の設計ドキュメントです。
- 進捗レポートは常に`reports/`フォルダに保存してください。
- 市販のPC・Webカメラ・プリンタで実現可能な構成を優先します。

---

## Top-Level Rules

- To maximize efficiency, **if you need to execute multiple independent processes, invoke those tools concurrently, not sequentially**.
- **You must think exclusively in English**. However, you are required to **respond in Japanese**.
- To understand how to use a library, **always use the Contex7 MCP** to retrieve the latest information.
- For temporary notes for design, create a markdown in `.tmp` and save it.
- **After using Write or Edit tools, ALWAYS verify the actual file contents using the Read tool**, regardless of what the system-reminder says. The system-reminder may incorrectly show "(no content)" even when the file has been successfully written.
- Please respond critically and without pandering to my opinions, but please don't be forceful in your criticism.

## Programming Rules

- Avoid hard-coding values unless absolutely necessary.
- Do not use `any` or `unknown` types in TypeScript.
- You must not use a TypeScript `class` unless it is absolutely necessary (e.g., extending the `Error` class for custom error handling that requires `instanceof` checks).

## Development Style - Specification-Driven Development

### Overview

When receiving development tasks, please follow the 5-stage workflow below. This ensures requirement clarification, structured design, comprehensive testing, and efficient implementation.

### 5-Stage Workflow

#### Stage 1: Requirements

- Analyze user requests and convert them into clear functional requirements
- Document requirements in `.tmp/requirements.md`
- Use `/requirements` command for detailed template

#### Stage 2: Design

- Create technical design based on requirements
- Document design in `.tmp/design.md`
- Use `/design` command for detailed template

#### Stage 3: Test Design

- Create comprehensive test specification based on design
- Document test cases in `.tmp/test_design.md`
- Use `/test-design` command for detailed template

#### Stage 4: Task List

- Break down design and test cases into implementable units
- Document in `.tmp/tasks.md`
- Use `/tasks` command for detailed template
- Manage major tasks with TodoWrite tool

#### Stage 5: Implementation

- Implement according to task list
- For each task:
  - Update task to in_progress using TodoWrite
  - Execute implementation and testing
  - Run lint and typecheck
  - Update task to completed using TodoWrite

### Workflow Commands

- `/spec` - Start the complete specification-driven development workflow
- `/requirements` - Execute Stage 1: Requirements only
- `/design` - Execute Stage 2: Design only (requires requirements)
- `/test-design` - Execute Stage 3: Test design only (requires design)
- `/tasks` - Execute Stage 4: Task breakdown only (requires design and test design)

### Important Notes

- Each stage depends on the deliverables of the previous stage
- Please obtain user confirmation before proceeding to the next stage
- Always use this workflow for complex tasks or new feature development
- Simple fixes or clear bug fixes can be implemented directly

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
