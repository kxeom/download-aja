const axios = require('axios');

class TikTokDownloader {
    constructor(url) {
        this.url = url;
        this.scrapers = {
            tikwm: this.tikwm.bind(this),
            ttdownloader: this.ttdownloader.bind(this),
            tikdown: this.tikdown.bind(this),
            ssstik: this.ssstik.bind(this),
            musicaldown: this.musicaldown.bind(this)
        };
    }

    async download() {
        for (const scraper of Object.values(this.scrapers)) {
            try {
                const result = await scraper();
                if (result) {
               //     console.log(`Berhasil menggunakan ${scraper.name}`);
                    return result;
                }
            } catch (error) {
                console.error(`Scraper error (${scraper.name}):`, error.message);
                continue;
            }
        }
        throw new Error('Semua metode scraping gagal');
    }

    async tikwm() {
        try {
            const response = await axios.post('https://www.tikwm.com/api/', {
                url: this.url,
                count: 12,
                cursor: 0,
                web: 1,
                hd: 1
            });
    
            if (response.data.code === 0) {
                const data = response.data.data;
                
                const getOriginalUrl = async (url) => {
                    try {
                        const headResponse = await axios.head(url, { 
                            maxRedirects: 0,
                            validateStatus: (status) => status >= 200 && status < 400 
                        });
                        return headResponse.headers.location || url;
                    } catch (error) {
                        return url;
                    }
                };
    
                const urls = await Promise.all([
                    getOriginalUrl('https://www.tikwm.com' + (data.hdplay || data.play)),
                    getOriginalUrl('https://www.tikwm.com' + data.wmplay),
                    getOriginalUrl('https://www.tikwm.com' + data.music)
                ]);
    
                return {
                    platform: 'tiktok',
                    title: data.title,
                    author: {
                        name: data.author.nickname,
                        username: data.author.unique_id,
                        avatarUrl: data.author.avatar
                    },
                    stats: {
                        plays: data.play_count,
                        likes: data.digg_count,
                        shares: data.share_count,
                        comments: data.comment_count
                    },
                    thumbnail: data.cover,
                    downloads: [
                        {
                            type: 'video_hd',
                            url: urls[0],
                            filename: `tiktok_${data.author.unique_id}_hd.mp4`
                        },
                        {
                            type: 'video_watermark',
                            url: urls[1],
                            filename: `tiktok_${data.author.unique_id}_watermark.mp4`
                        },
                        {
                            type: 'audio',
                            url: urls[2],
                            filename: `tiktok_${data.author.unique_id}_audio.mp3`
                        }
                    ]
                };
            }
            return null;
        } catch (error) {
            throw new Error('TikWM Error: ' + error.message);
        }
    }

    async ttdownloader() {
        throw new Error('TTDownloader belum diimplementasi');
    }

    async tikdown() {
        throw new Error('TikDown belum diimplementasi');
    }

    async ssstik() {
        throw new Error('SssTik belum diimplementasi');
    }

    async musicaldown() {
        throw new Error('MusicalDown belum diimplementasi');
    }
}

module.exports = TikTokDownloader;