(() => {
  "use strict";

  const list = document.getElementById("news-list");
  const template = document.getElementById("news-card-template");

  if (!list || !template) return;

  const language = () => window.siteLanguage?.language || "ko";
  const translate = (key) => window.siteLanguage?.translate(key) || window.siteTranslations?.ko[key] || key;
  let posts = [];
  let status = "loading";

  const formatDate = (value) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(language() === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  const renderParagraphs = (container, content) => {
    String(content || "")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .forEach((paragraph) => {
        const element = document.createElement("p");
        element.textContent = paragraph;
        container.append(element);
      });
  };

  const renderPost = (post) => {
    const localized = post.translations?.[language()];
    const copy = { ...post, ...localized };
    const card = template.content.firstElementChild.cloneNode(true);
    card.lang = localized ? language() : (post.lang || "ko");
    const time = card.querySelector("time");
    const media = card.querySelector(".news-card-media");
    const image = media.querySelector("img");

    const category = card.querySelector(".news-category");
    const categoryKey = `category.${post.category || "Update"}`;
    category.textContent = translate(categoryKey) === categoryKey ? post.category : translate(categoryKey);
    category.lang = language();
    time.dateTime = post.date || "";
    time.textContent = formatDate(post.date || "");
    time.lang = language();
    card.querySelector("h2").textContent = copy.title || translate("news.untitled");
    card.querySelector(".news-summary").textContent = copy.summary || "";
    renderParagraphs(card.querySelector(".news-body"), copy.content);

    if (post.image) {
      image.src = post.image;
      image.alt = copy.imageAlt || "";
      media.hidden = false;
    }

    const links = card.querySelector(".news-links");
    (Array.isArray(post.links) ? post.links : []).forEach((item, index) => {
      if (!item?.url) return;
      const link = document.createElement("a");
      link.href = item.url;
      link.textContent = localized?.linkLabels?.[index] || item.label || translate("news.more");
      link.target = "_blank";
      link.rel = "noreferrer";
      links.append(link);
    });

    return card;
  };

  const render = () => {
    list.replaceChildren();
    if (status !== "ready" || !posts.length) {
      const message = document.createElement("p");
      message.className = status === "loading" ? "news-loading" : "news-empty";
      message.textContent = translate(status === "loading" ? "news.loading" : status === "error" ? "news.error" : "news.empty");
      list.append(message);
      return;
    }
    posts.forEach((post) => list.append(renderPost(post)));
  };

  document.addEventListener("site-language-change", render);

  fetch("news-data.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Unable to load news data.");
      return response.json();
    })
    .then((data) => {
      posts = (Array.isArray(data) ? data : [])
        .slice()
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));
      status = "ready";
      render();
    })
    .catch(() => {
      status = "error";
      render();
    });
})();
