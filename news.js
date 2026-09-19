(() => {
  "use strict";

  const list = document.getElementById("news-list");
  const template = document.getElementById("news-card-template");

  if (!list || !template) return;

  const formatDate = (value) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en", {
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
    const card = template.content.firstElementChild.cloneNode(true);
    const time = card.querySelector("time");
    const media = card.querySelector(".news-card-media");
    const image = media.querySelector("img");

    card.querySelector(".news-category").textContent = post.category || "Update";
    time.dateTime = post.date || "";
    time.textContent = formatDate(post.date || "");
    card.querySelector("h2").textContent = post.title || "Untitled";
    card.querySelector(".news-summary").textContent = post.summary || "";
    renderParagraphs(card.querySelector(".news-body"), post.content);

    if (post.image) {
      image.src = post.image;
      image.alt = post.imageAlt || "";
      media.hidden = false;
    }

    const links = card.querySelector(".news-links");
    (Array.isArray(post.links) ? post.links : []).forEach((item) => {
      if (!item?.url) return;
      const link = document.createElement("a");
      link.href = item.url;
      link.textContent = item.label || "Learn more";
      link.target = "_blank";
      link.rel = "noreferrer";
      links.append(link);
    });

    return card;
  };

  fetch("news-data.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Unable to load news data.");
      return response.json();
    })
    .then((posts) => {
      list.replaceChildren();
      const sortedPosts = (Array.isArray(posts) ? posts : [])
        .slice()
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      if (!sortedPosts.length) {
        const empty = document.createElement("p");
        empty.className = "news-empty";
        empty.textContent = "No news has been posted yet.";
        list.append(empty);
        return;
      }

      sortedPosts.forEach((post) => list.append(renderPost(post)));
    })
    .catch(() => {
      list.innerHTML = '<p class="news-empty">The news feed could not be loaded. Please try again later.</p>';
    });
})();
