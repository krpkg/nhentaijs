"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  NHentaiClient: () => NHentaiClient,
  getExtension: () => getExtension,
  parseGalleryId: () => parseGalleryId,
  sanitizeFilename: () => sanitizeFilename
});
module.exports = __toCommonJS(index_exports);

// src/utils.ts
function getExtension(type) {
  switch (type) {
    case "j":
      return "jpg";
    case "p":
      return "png";
    case "g":
      return "gif";
    case "w":
      return "webp";
    default:
      return type || "jpg";
  }
}
function parseGalleryId(input) {
  const str = String(input).trim();
  const match = str.match(/(?:(?:nhentai\.net)?\/g\/|^)(\d+)/);
  if (match && match[1]) {
    return match[1];
  }
  if (/^\d+$/.test(str)) {
    return str;
  }
  throw new Error(`Unable to extract valid gallery ID from input: "${input}"`);
}
function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim().substring(0, 150) || "gallery";
}

// src/client.ts
var import_jszip = __toESM(require("jszip"));
var NHentaiClient = class {
  baseUrl;
  imageServers;
  thumbServers;
  apiKey;
  fetchFn;
  userAgent;
  cookie;
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || "https://nhentai.net").replace(/\/+$/, "");
    this.imageServers = options.imageServers && options.imageServers.length > 0 ? options.imageServers.map((s) => s.replace(/\/+$/, "")) : ["https://i1.nhentai.net", "https://i3.nhentai.net", "https://i4.nhentai.net"];
    this.thumbServers = options.thumbServers && options.thumbServers.length > 0 ? options.thumbServers.map((s) => s.replace(/\/+$/, "")) : ["https://t1.nhentai.net", "https://t3.nhentai.net", "https://t4.nhentai.net"];
    this.apiKey = options.apiKey;
    this.fetchFn = options.fetch || (typeof globalThis !== "undefined" ? globalThis.fetch.bind(globalThis) : fetch);
    this.userAgent = options.userAgent || "nhentaijs/1.0.0 (https://github.com/user/nhentaijs)";
    this.cookie = options.cookie;
  }
  /**
   * Builds headers complying with nHentai API v2 requirements.
   */
  getHeaders() {
    const headers = {
      Accept: "application/json",
      "User-Agent": this.userAgent
    };
    if (this.apiKey) {
      headers["Authorization"] = `Key ${this.apiKey}`;
      headers["X-API-Key"] = this.apiKey;
    }
    if (this.cookie) {
      headers["Cookie"] = this.cookie;
    }
    return headers;
  }
  /**
   * Fetches gallery metadata by URL or ID using official API v2.
   */
  async getGallery(input) {
    const id = parseGalleryId(input);
    const headers = this.getHeaders();
    const v2Url = `${this.baseUrl}/api/v2/galleries/${id}`;
    const res = await this.fetchFn(v2Url, { headers });
    if (!res.ok) {
      let errorMsg = res.statusText || `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.error) {
          errorMsg = errJson.error;
        } else if (errJson?.message) {
          errorMsg = errJson.message;
        }
      } catch {
      }
      if (res.status === 429) {
        throw new Error(`Rate limit exceeded on nHentai API (429). Please wait a moment or provide an API Key.`);
      }
      throw new Error(`Failed to fetch gallery metadata for ID ${id}: ${errorMsg}`);
    }
    const data = await res.json();
    return data;
  }
  /**
   * Returns the direct cover image URL.
   */
  getCoverUrl(gallery) {
    if (!gallery?.cover?.path) {
      return "";
    }
    const cleanPath = gallery.cover.path.replace(/^\/+/, "");
    const server = this.thumbServers[0] || "https://t1.nhentai.net";
    return `${server}/${cleanPath}`;
  }
  /**
   * Returns the direct image URL for a given 1-based page number.
   */
  getPageUrl(gallery, pageNumber) {
    const page = gallery.pages?.find((p) => p.number === pageNumber) || gallery.pages?.[pageNumber - 1];
    if (!page?.path) {
      throw new Error(`Page ${pageNumber} not found in gallery`);
    }
    const cleanPath = page.path.replace(/^\/+/, "");
    const serverIndex = (pageNumber - 1) % this.imageServers.length;
    const server = this.imageServers[serverIndex];
    return `${server}/${cleanPath}`;
  }
  /**
   * Downloads an individual image with retry, backoff, and server failover.
   */
  async downloadImage(cleanPath, pageNumber, options = {}) {
    const { maxRetries = 3, signal } = options;
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (signal?.aborted) {
        throw new DOMException("Download aborted", "AbortError");
      }
      const serverIndex = (pageNumber - 1 + attempt) % this.imageServers.length;
      const server = this.imageServers[serverIndex];
      const url = `${server}/${cleanPath}`;
      try {
        const timeoutSignal = AbortSignal.timeout(12e3);
        const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
        const response = await this.fetchFn(url, {
          signal: combinedSignal,
          headers: {
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "User-Agent": this.userAgent,
            ...this.cookie ? { Cookie: this.cookie } : {}
          }
        });
        if (response.status === 429) {
          const delay = 1500 * (attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        return await response.arrayBuffer();
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          const delay = 800 * (attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw new Error(`Failed to download page ${pageNumber} after ${maxRetries} attempts: ${lastError?.message}`);
  }
  /**
   * Downloads all pages for a gallery and packages them into a Zip file (Uint8Array).
   */
  async downloadZip(input, options = {}) {
    const gallery = typeof input === "object" && "pages" in input ? input : await this.getGallery(input);
    const { concurrency = 2, delayMs = 150, maxRetries = 3, onProgress, signal } = options;
    const zip = new import_jszip.default();
    const folderName = sanitizeFilename(gallery.title.pretty || gallery.title.english || `nhentai_${gallery.id}`);
    const folder = zip.folder(folderName) || zip;
    const pages = gallery.pages || [];
    const total = pages.length;
    let completedCount = 0;
    const pageTasks = pages.map((page) => {
      const pageNumber = page.number;
      const cleanPath = page.path.replace(/^\/+/, "");
      const ext = cleanPath.split(".").pop() || "jpg";
      const filename = `${String(pageNumber).padStart(3, "0")}.${ext}`;
      return { pageNumber, filename, cleanPath };
    });
    let cursor = 0;
    const worker = async () => {
      while (cursor < pageTasks.length) {
        if (signal?.aborted) {
          throw new DOMException("Download aborted", "AbortError");
        }
        const taskIndex = cursor++;
        const task = pageTasks[taskIndex];
        const buffer = await this.downloadImage(task.cleanPath, task.pageNumber, {
          maxRetries,
          signal
        });
        folder.file(task.filename, buffer);
        completedCount++;
        if (onProgress) {
          onProgress({
            current: completedCount,
            total,
            pageIndex: task.pageNumber,
            percentage: Math.round(completedCount / total * 100),
            stage: "downloading"
          });
        }
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    };
    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);
    if (onProgress) {
      onProgress({
        current: total,
        total,
        pageIndex: total,
        percentage: 100,
        stage: "compressing"
      });
    }
    const zipData = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });
    if (onProgress) {
      onProgress({
        current: total,
        total,
        pageIndex: total,
        percentage: 100,
        stage: "done"
      });
    }
    return {
      data: zipData,
      filename: `${folderName}.zip`,
      gallery
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NHentaiClient,
  getExtension,
  parseGalleryId,
  sanitizeFilename
});
//# sourceMappingURL=index.js.map