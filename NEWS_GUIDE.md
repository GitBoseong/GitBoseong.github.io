# News page guide

1. Open `new.html` through the published website or a local web server.
2. Enter the date, category, title, summary, body, and optional link.
3. Choose a JPG, PNG, WebP, or GIF image if the post needs a photo.
4. Select **Save to website folder** and choose the repository root (the folder containing `index.html`).
5. Commit and push the changed `news-data.json` and any new file in `images/news/`.

Chrome or Edge is required for direct folder saving. The **Download files** button is available as a fallback.

The public feed is `news.html`. Posts are stored in `news-data.json`, newest first by date.

## Korean and English

The public CV and News pages default to Korean. The language button switches both pages and remembers the visitor's preference.

Write the editor's title, summary, content, photo description, and link labels in Korean. For an English version, add `translations.en` to the saved post in `news-data.json` with `title`, `summary`, `content`, `imageAlt`, and `linkLabels` (an array in the same order as `links`). Images, dates, categories, and link URLs are shared. Set `lang` to the original post language (`ko` by default). A post without a translation remains in its original language.

Public interface and CV translations live in `translations.js`; matching `data-i18n` keys in the HTML connect each element to its translation. Keep the static HTML in Korean so the CV also reads correctly without JavaScript. International journal citations retain their original titles in both versions.
