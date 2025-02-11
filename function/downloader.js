// --------------------------------------
const TiktokDownloader = require('./file/tiktok');
const CapcutDownloader = require('./file/capcut');
const XiaohongshuDownloader = require('./file/xiaohongshu');
const ThreadsDownloader = require('./file/threads');
const SoundcloudDownloader = require('./file/soundcloud');
// --------------------------------------


class Downloader {
    constructor() {
        this.platformPatterns = {
            tiktok: /(?:https?:\/\/)?(?:www\.|vm\.|vt\.|m\.)?(?:tiktok\.com|douyin\.com|snaptik\.app|musicaldown\.com|tiktokcdn\.com)(?:\/.*)?/i,
            capcut: /(?:https?:\/\/)?(?:www\.|m\.)?(?:capcut\.com|capcutpro\.com)(?:\/.*)?/i,
            xiaohongshu: /(?:https?:\/\/)?(?:www\.|m\.)?(?:xiaohongshu\.com|xhslink\.com|xhs\.cn)(?:\/.*)?/i,
            threads: /(?:https?:\/\/)?(?:www\.|m\.)?threads\.net(?:\/.*)?/i,
            soundcloud: /(?:https?:\/\/)?(?:www\.|m\.)?(?:soundcloud\.com|snd\.sc)(?:\/.*)?/i
        };

        this.downloaders = {
            tiktok: TiktokDownloader,
            capcut: CapcutDownloader,
            xiaohongshu: XiaohongshuDownloader,
            threads: ThreadsDownloader,
            soundcloud: SoundcloudDownloader
        };
    }

    getPlatform(url) {
        if (!url) throw new Error('URL tidak boleh kosong');

        for (const [platform, pattern] of Object.entries(this.platformPatterns)) {
            if (pattern.test(url)) {
                return platform;
            }
        }
        
        throw new Error('Platform tidak didukung');
    }

    async download(url) {
        try {
            if (!url) {
                throw new Error('URL tidak boleh kosong');
            }

            url = url.trim();

            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            const platform = this.getPlatform(url);
            
            if (!this.downloaders[platform]) {
                throw new Error(`Platform ${platform} tidak didukung`);
            }

         //   console.log(`Downloading from ${platform}:`, url);

            const DownloaderClass = this.downloaders[platform];
            const downloader = new DownloaderClass(url);
            
            const result = await downloader.download();
            
            if (!result) {
                throw new Error('Gagal mendapatkan hasil download');
            }

            return result;

        } catch (error) {
            console.error('Download Error:', error);
            throw error;
        }
    }
}

// Export instance
const downloaderInstance = new Downloader();
module.exports = downloaderInstance;