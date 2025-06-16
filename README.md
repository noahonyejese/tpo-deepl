# tpo-deepl

> Translate missing entries in `.po` files using DeepL — and detect duplicates for better translation memory management.

`tpo-deepl` is a CLI tool for modern gettext-based i18n workflows. It combines:

- ✅ **DeepL-based auto-translation** for missing `msgstr` entries.
- ✅ **Advanced duplicate detection** to identify redundant or overly similar translations.
- ✅ Designed for localization teams who want automation without sacrificing quality.

---

## 🚀 Installation

Install globally using pnpm:

```bash
pnpm install -g tpo-deepl
```

---

## ⚙️ Setup

### 1️⃣ Get your DeepL API key

Sign up at [deepl.com/pro](https://www.deepl.com/en/pro) — free up to 500,000 characters/month.

### 2️⃣ Configure your environment

You can either:

```env
# .env file:
DEEPL_API_KEY=your-key-here
```

or export it directly:

```bash
export DEEPL_API_KEY=your-key-here
```

### 3️⃣ Create a config file

In your project root, create `tpo.config.json` or `tpo.config.ts`:

```json
{
  "localesPath": "./src/locales/{locale}/messages.po",
  "mainLanguage": "de"
}
```

- Use `{locale}` placeholder where the language codes are located.
- Make sure your file paths point to valid `.po` files.

---

## 🔧 Commands

### `tpo translate`

Auto-translate all missing `.po` entries using DeepL.

```bash
tpo translate [options]
```

#### Options

| Option                | Description                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| `--dry-run`           | Preview translations without modifying files                             |
| `--formality <level>` | DeepL formality: `less`, `more`, `prefer_less`, `prefer_more`, `default` |
| `--only <lang>`       | Translate only specific language (e.g. `fr`)                             |
| `--silent`            | Suppress output                                                          |
| `--config <path>`     | Use a custom config file instead of default                              |

#### Examples

Translate all missing entries with formal tone:

```bash
tpo translate --formality more
```

Translate only French:

```bash
tpo translate --only fr
```

Preview changes without modifying files:

```bash
tpo translate --dry-run
```

---

### `tpo duplicates`

Detect duplicate translations inside your `.po` files.

```bash
tpo duplicates [options]
```

#### Default mode

By default, detects **strict identical `msgstr` duplicates** per language file.

#### Advanced near-duplicate detection

| Option                  | Description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| `--words <number>`      | Minimum consecutive words to match                                 |
| `--similarity <number>` | Allow small gaps inside consecutive matches (only with `--words`)  |
| `--only <lang>`         | Limit scan to specific language                                    |
| `--strict`              | Fail with non-zero exit code if duplicates are found (CI friendly) |

#### Examples

Detect strict duplicates (default):

```bash
tpo duplicates
```

Detect duplicates with at least 3 consecutive identical words:

```bash
tpo duplicates --words 3
```

Detect duplicates allowing 1 mismatch inside a 3-word sequence:

```bash
tpo duplicates --words 3 --similarity 1
```

Limit detection to German:

```bash
tpo duplicates --only de
```

---

## 📝 License

MIT
