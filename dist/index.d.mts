interface CoverInfo {
    path: string;
    width: number;
    height: number;
}
interface PageInfo {
    number: number;
    path: string;
    width: number;
    height: number;
    thumbnail: string;
    thumbnail_width: number;
    thumbnail_height: number;
}
interface GalleryTag {
    id: number;
    type: string;
    name: string;
    url?: string;
    count?: number;
}
interface GalleryTitle {
    english: string;
    japanese?: string;
    pretty: string;
}
interface CdnConfig {
    image_servers: string[];
    thumb_servers: string[];
}
interface Gallery {
    id: number | string;
    media_id: string;
    title: GalleryTitle;
    cover: CoverInfo;
    thumbnail?: CoverInfo;
    pages: PageInfo[];
    scanlator?: string;
    upload_date: number;
    tags: GalleryTag[];
    num_pages: number;
    num_favorites?: number;
}
interface ClientOptions {
    /**
     * Optional API key (passed as `Authorization: Key <api_key>`).
     */
    apiKey?: string;
    /**
     * Base URL for the API.
     * Defaults to https://nhentai.net
     */
    baseUrl?: string;
    /**
     * Base URL for image CDN or array of servers for round-robin.
     */
    imageServers?: string[];
    /**
     * Base URL for thumbnail CDN.
     */
    thumbServers?: string[];
    /**
     * Custom request fetcher (defaults to global fetch).
     */
    fetch?: typeof fetch;
    /**
     * Custom User-Agent header (defaults to nhentaijs/1.0.0).
     */
    userAgent?: string;
    /**
     * Optional cookies or session tokens.
     */
    cookie?: string;
}
interface DownloadProgress {
    current: number;
    total: number;
    pageIndex: number;
    percentage: number;
    stage: 'downloading' | 'compressing' | 'done';
}
interface DownloadOptions {
    /**
     * Number of concurrent image downloads. Default: 2.
     */
    concurrency?: number;
    /**
     * Delay in milliseconds between consecutive requests. Default: 150ms.
     */
    delayMs?: number;
    /**
     * Number of retries per page upon failure or rate limit. Default: 3.
     */
    maxRetries?: number;
    /**
     * Progress callback.
     */
    onProgress?: (progress: DownloadProgress) => void;
    /**
     * AbortSignal to cancel download.
     */
    signal?: AbortSignal;
}

/**
 * Maps NHentai internal single-letter image type indicators to file extensions.
 */
declare function getExtension(type: string): string;
/**
 * Extracts gallery ID from raw input (numeric string, nhentai URL, or path).
 *
 * Supported formats:
 * - "521265"
 * - "https://nhentai.net/g/521265/"
 * - "https://nhentai.net/g/521265/1/"
 * - "/g/521265"
 */
declare function parseGalleryId(input: string | number): string;
/**
 * Sanitizes a title for safe use as a filename or zip folder name.
 */
declare function sanitizeFilename(name: string): string;

declare class NHentaiClient {
    private baseUrl;
    private imageServers;
    private thumbServers;
    private apiKey?;
    private fetchFn;
    private userAgent;
    private cookie?;
    constructor(options?: ClientOptions);
    /**
     * Builds headers complying with nHentai API v2 requirements.
     */
    private getHeaders;
    /**
     * Fetches gallery metadata by URL or ID using official API v2.
     */
    getGallery(input: string | number): Promise<Gallery>;
    /**
     * Returns the direct cover image URL.
     */
    getCoverUrl(gallery: Gallery): string;
    /**
     * Returns the direct image URL for a given 1-based page number.
     */
    getPageUrl(gallery: Gallery, pageNumber: number): string;
    /**
     * Downloads an individual image with retry, backoff, and server failover.
     */
    downloadImage(cleanPath: string, pageNumber: number, options?: {
        maxRetries?: number;
        signal?: AbortSignal;
    }): Promise<ArrayBuffer>;
    /**
     * Downloads all pages for a gallery and packages them into a Zip file (Uint8Array).
     */
    downloadZip(input: string | number | Gallery, options?: DownloadOptions): Promise<{
        data: Uint8Array;
        filename: string;
        gallery: Gallery;
    }>;
}

export { type CdnConfig, type ClientOptions, type CoverInfo, type DownloadOptions, type DownloadProgress, type Gallery, type GalleryTag, type GalleryTitle, NHentaiClient, type PageInfo, getExtension, parseGalleryId, sanitizeFilename };
