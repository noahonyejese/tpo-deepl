# tpo-deepl

> Translate missing entries in `.po` files using DeepL.

`tpo-deepl` is a CLI tool that automatically fills in untranslated `.po` entries using the [DeepL API](https://www.deepl.com/en/pro). Ideal for localization workflows using gettext.

---

## 🚀 Installation

Install globally using pnpm:

```bash
pnpm install -g tpo-deepl
```

---

## ⚙️ Setup

1. **Get your DeepL API key**  
   Sign up at [deepl.com/pro](https://www.deepl.com/en/pro) — it’s free for up to 500,000 characters/month.

2. **Add your API key to your environment**  
   You can add it to a `.env` file or set it directly:

   ```bash
   export DEEPL_API_KEY=your-key-here
   ```

3. **Create a config file**  
   Create a `tpo.config.json` or `tpo.config.ts` in your project root:

   ```json
   {
     "localesPath": "./src/locales/{locale}/messages.po",
     "mainLanguage": "de"
   }
   ```

   - Replace the `localesPath` with your actual structure.
   - Make sure at least one non-main language `.po` file has entries with `msgstr ""`.

---

## 🔧 Command

### `tpo translate`

Translate missing `.po` entries using DeepL.

```bash
tpo translate [options]
```

### Options

| Option                | Description                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| `--dry-run`           | Preview what would be translated without making changes                  |
| `--formality <level>` | Control tone: `less`, `more`, `prefer_less`, `prefer_more`, or `default` |
| `--only <lang>`       | Only translate the specified language (e.g. `fr`)                        |
| `--silent`            | Suppress output messages                                                 |
| `--config <path>`     | Load a custom config file instead of the default `tpo.config.ts`         |

---

## 📘 Examples

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

## 📝 License

MIT
