(() => {
  "use strict";

  const form = document.getElementById("post-form");
  if (!form) return;

  const fields = {
    date: document.getElementById("post-date"),
    category: document.getElementById("post-category"),
    title: document.getElementById("post-title"),
    summary: document.getElementById("post-summary"),
    content: document.getElementById("post-content"),
    linkLabel: document.getElementById("post-link-label"),
    linkUrl: document.getElementById("post-link-url"),
    image: document.getElementById("post-image"),
    imageAlt: document.getElementById("post-image-alt")
  };

  const status = document.getElementById("editor-status");
  const downloadButton = document.getElementById("download-button");
  const altField = document.getElementById("alt-field");
  let newsData = [];
  let previewUrl = "";

  fields.date.value = new Date().toISOString().slice(0, 10);

  const formatDate = (value) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  const slugify = (value) => value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 56) || "news";

  const extensionFor = (file) => {
    const fromName = file?.name?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
      return fromName === "jpeg" ? "jpg" : fromName;
    }
    return "jpg";
  };

  const buildPost = (imagePath = "") => {
    const links = [];
    if (fields.linkUrl.value.trim()) {
      links.push({
        label: fields.linkLabel.value.trim() || "Learn more",
        url: fields.linkUrl.value.trim()
      });
    }

    const id = `${fields.date.value}-${slugify(fields.title.value)}`;
    return {
      id,
      date: fields.date.value,
      category: fields.category.value,
      title: fields.title.value.trim(),
      summary: fields.summary.value.trim(),
      content: fields.content.value.trim(),
      image: imagePath,
      imageAlt: fields.imageAlt.value.trim(),
      links
    };
  };

  const renderPreview = () => {
    document.getElementById("preview-category").textContent = fields.category.value;
    document.getElementById("preview-date").textContent = formatDate(fields.date.value);
    document.getElementById("preview-date").dateTime = fields.date.value;
    document.getElementById("preview-heading").textContent = fields.title.value.trim() || "Your post title";
    document.getElementById("preview-summary").textContent = fields.summary.value.trim() || "Your short summary will appear here.";

    const body = document.getElementById("preview-body");
    body.replaceChildren();
    fields.content.value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean).forEach((part) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = part;
      body.append(paragraph);
    });

    const links = document.getElementById("preview-links");
    links.replaceChildren();
    if (fields.linkUrl.value.trim()) {
      const link = document.createElement("a");
      link.href = fields.linkUrl.value.trim();
      link.textContent = fields.linkLabel.value.trim() || "Learn more";
      links.append(link);
    }
  };

  Object.values(fields).forEach((field) => {
    if (field !== fields.image) field.addEventListener("input", renderPreview);
  });

  fields.image.addEventListener("change", () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const file = fields.image.files?.[0];
    const media = document.getElementById("preview-media");
    const image = document.getElementById("preview-image");
    altField.hidden = !file;

    if (!file) {
      media.hidden = true;
      image.removeAttribute("src");
      previewUrl = "";
      return;
    }

    previewUrl = URL.createObjectURL(file);
    image.src = previewUrl;
    image.alt = fields.imageAlt.value.trim();
    media.hidden = false;
  });

  fields.imageAlt.addEventListener("input", () => {
    document.getElementById("preview-image").alt = fields.imageAlt.value.trim();
  });

  const readCurrentNews = async () => {
    const response = await fetch("news-data.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not read news-data.json.");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  readCurrentNews().then((data) => {
    newsData = data;
  }).catch(() => {
    status.textContent = "The current news file could not be loaded. Open this page through the website or a local web server.";
    status.className = "editor-status error";
  });

  const makeImageName = (file) => {
    const slug = `${fields.date.value}-${slugify(fields.title.value)}`;
    return `${slug}.${extensionFor(file)}`;
  };

  const updatedNews = (post, currentNews = newsData) => [
    post,
    ...currentNews.filter((item) => item.id !== post.id)
  ];

  const readNewsFile = async (fileHandle) => {
    const file = await fileHandle.getFile();
    const data = JSON.parse(await file.text());
    return Array.isArray(data) ? data : [];
  };

  const writeJson = async (fileHandle, data) => {
    const writable = await fileHandle.createWritable();
    await writable.write(`${JSON.stringify(data, null, 2)}\n`);
    await writable.close();
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (!("showDirectoryPicker" in window)) {
      status.textContent = "Direct folder saving is supported in Chrome and Edge. Use Download files instead.";
      status.className = "editor-status error";
      return;
    }

    try {
      status.textContent = "Choose the local website folder…";
      status.className = "editor-status";
      const root = await window.showDirectoryPicker({ mode: "readwrite" });
      await root.getFileHandle("index.html");
      const dataHandle = await root.getFileHandle("news-data.json");
      const currentNews = await readNewsFile(dataHandle);

      let imagePath = "";
      const imageFile = fields.image.files?.[0];
      if (imageFile) {
        const images = await root.getDirectoryHandle("images");
        const newsImages = await images.getDirectoryHandle("news", { create: true });
        const imageName = makeImageName(imageFile);
        const imageHandle = await newsImages.getFileHandle(imageName, { create: true });
        const imageWritable = await imageHandle.createWritable();
        await imageWritable.write(imageFile);
        await imageWritable.close();
        imagePath = `images/news/${imageName}`;
      }

      const post = buildPost(imagePath);
      const nextNews = updatedNews(post, currentNews);
      await writeJson(dataHandle, nextNews);
      newsData = nextNews;
      status.textContent = "Saved. Commit and push news-data.json and the new image to publish the post.";
      status.className = "editor-status success";
    } catch (error) {
      if (error?.name === "AbortError") {
        status.textContent = "Saving was cancelled.";
      } else {
        status.textContent = "Could not save. Make sure you selected this website's root folder.";
      }
      status.className = "editor-status error";
    }
  });

  downloadButton.addEventListener("click", async () => {
    if (!form.reportValidity()) return;

    try {
      newsData = await readCurrentNews();
    } catch {
      // Use the latest successfully loaded copy when the page is temporarily offline.
    }

    const imageFile = fields.image.files?.[0];
    const imagePath = imageFile ? `images/news/${makeImageName(imageFile)}` : "";
    const post = buildPost(imagePath);
    const jsonBlob = new Blob([`${JSON.stringify(updatedNews(post), null, 2)}\n`], { type: "application/json" });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement("a");
    jsonLink.href = jsonUrl;
    jsonLink.download = "news-data.json";
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);

    if (imageFile) {
      const imageUrl = URL.createObjectURL(imageFile);
      const imageLink = document.createElement("a");
      imageLink.href = imageUrl;
      imageLink.download = makeImageName(imageFile);
      imageLink.click();
      URL.revokeObjectURL(imageUrl);
    }

    status.textContent = imageFile
      ? "Downloaded the updated data and photo. Place them in the website root and images/news folder."
      : "Downloaded the updated news-data.json file.";
    status.className = "editor-status success";
  });

  renderPreview();
})();
