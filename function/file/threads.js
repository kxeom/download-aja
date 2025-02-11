const axios = require('axios');

class ThreadsDownloader {
    constructor(url) {
        this.url = url;
        this.FAKE_AGENTS = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ];
    }

    async download() {
        try {
            // url check, 1x
            if (!this.url.match(/threads\.net/gi)) {
                throw new Error('URL Threads tidak valid');
            }

            const apiResponse = await axios.get(`https://api.threadsphotodownloader.com/v2/media`, {
                params: { url: this.url },
                headers: {
                    'User-Agent': this.FAKE_AGENTS[Math.floor(Math.random() * this.FAKE_AGENTS.length)],
                    'Accept': '*/*',
                    'Origin': 'https://sssthreads.pro',
                    'Referer': 'https://sssthreads.pro/'
                },
                timeout: 30000
            });

           // console.log('API Response:', apiResponse.data);


            if (!apiResponse.data) {
                throw new Error('Tidak ada data dari API');
            }

            const downloads = [];
            if (apiResponse.data.video_urls && apiResponse.data.video_urls.length > 0) {
                apiResponse.data.video_urls.forEach((video, index) => {
                    if (video.download_url) {
                        downloads.push({
                            type: 'video',
                            url: video.download_url,
                            filename: `threads_video_${Date.now()}_${index + 1}.mp4`
                        });
                    }
                });
            }

            if (apiResponse.data.image_urls && apiResponse.data.image_urls.length > 0) {
                apiResponse.data.image_urls.forEach((imageUrl, index) => {
                    downloads.push({
                        type: 'image',
                        url: imageUrl,
                        filename: `threads_image_${Date.now()}_${index + 1}.jpg`
                    });
                });
            }

            if (downloads.length === 0) {
                throw new Error('Tidak dapat menemukan media');
            }

            return {
                platform: 'threads',
                metadata: {
                    title: '',  
                    caption: '', 
                    author: {
                        name: 'Threads User',
                        username: 'threads_user',
                        avatar: 'https://via.placeholder.com/150'
                    },
                    likes: 0,
                    replies: 0,
                    created_at: new Date().toISOString()
                },
                downloads: downloads
            };

        } catch (error) {
            console.error('Threads Download Error:', error);
            if (error.response) {
                console.error('Error Response:', error.response.data);
            }
            throw new Error('Gagal mengunduh dari Threads: ' + error.message);
        }
    }

    async downloadMedia(url) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': this.FAKE_AGENTS[Math.floor(Math.random() * this.FAKE_AGENTS.length)]
                }
            });

            return {
                data: response.data,
                contentType: response.headers['content-type']
            };
        } catch (error) {
            throw new Error('Gagal mengunduh media: ' + error.message);
        }
    }
}

module.exports = ThreadsDownloader;