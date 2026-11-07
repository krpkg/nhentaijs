# nhentaijs

Lightweight, universal TypeScript client and SDK for nHentai supporting API v2 with in-memory ZIP archiving and progress tracking.

Fully compatible with Node.js, Bun, modern browsers, React Native, and Expo.

## Features

- URL & ID Parsing: Supports raw numeric gallery IDs, full URLs (`https://nhentai.net/g/123456/`), and paths (`/g/123456`).
- API v2 Support: Fetches metadata, tags, image dimensions, cover thumbnails, and page listings.
- Resilient Downloads: Concurrent image downloads with automatic multi-CDN rotation, exponential backoff, retry handling, and pacing delays.
- In-Memory ZIP Generation: Automatically packages gallery pages into compressed ZIP archives using JSZip.
- Universal Runtime: Uses standard `fetch` and typed ArrayBuffers without platform-specific binary dependencies.
- Progress Reporting: Emits real-time progress callbacks for download stages (`downloading`, `compressing`, `done`).

## Installation

Using krpkg CLI:

```bash
krpkg install nhentaijs
```

Using Bun:

```bash
bun add github:krpkg/nhentaijs
```

Using npm:

```bash
npm install github:krpkg/nhentaijs
```

## Quick Start

```typescript
import { NHentaiClient } from 'nhentaijs';

const client = new NHentaiClient({
  // Optional configuration
  // apiKey: '...',
  // userAgent: 'custom-user-agent',
});

// 1. Fetch gallery details
const gallery = await client.getGallery('https://nhentai.net/g/521265/');
console.log('Title:', gallery.title.pretty);
console.log('Total pages:', gallery.num_pages);
console.log('Cover URL:', client.getCoverUrl(gallery));

// 2. Download all pages into a ZIP archive
const { data, filename } = await client.downloadZip(gallery, {
  concurrency: 3,
  delayMs: 100,
  onProgress: (progress) => {
    console.log(`[${progress.stage}] ${progress.current}/${progress.total} (${progress.percentage}%)`);
  },
});

console.log(`Downloaded ${filename} (${data.byteLength} bytes)`);
```

## Client Configuration

The `NHentaiClient` constructor accepts an optional configuration object:

```typescript
interface ClientOptions {
  baseUrl?: string;          // Default: "https://nhentai.net"
  imageServers?: string[];   // CDN image server list for round-robin
  thumbServers?: string[];   // Thumbnail server list
  apiKey?: string;           // Optional API key for authorization header
  userAgent?: string;        // Custom User-Agent header
  cookie?: string;           // Optional session cookie
  fetch?: typeof fetch;      // Custom fetch implementation
}
```

## Download Options

When calling `downloadZip()`, configure execution parameters:

```typescript
interface DownloadOptions {
  concurrency?: number;      // Concurrent page downloads (default: 2)
  delayMs?: number;          // Pacing delay between requests in ms (default: 150)
  maxRetries?: number;       // Maximum retries per failed page (default: 3)
  signal?: AbortSignal;      // AbortSignal for task cancellation
  onProgress?: (progress: DownloadProgress) => void;
}
```

## License

Apache-2.0
