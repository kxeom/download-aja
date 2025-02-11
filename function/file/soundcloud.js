const scdl = require('soundcloud-downloader').default;

class SoundCloudDownloader {
    constructor(url) {
        this.url = url;
        this.CLIENT_ID = 'yLfooVZK5emWPvRLZQlSuGTO8pof6z4t';
    }

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds.padStart(2, '0')}`;
    }

    async download() {
        try {
            if (!this.url.includes('soundcloud.com')) {
                throw new Error('URL SoundCloud tidak valid');
            }




            const info = await scdl.getInfo(this.url, this.CLIENT_ID);
         //   console.log('Track Info:', info); // Debug
            const result = {
                platform: 'soundcloud',
                metadata: {
                    title: info.title,
                    description: info.description || '',
                    duration: this.formatDuration(info.duration),
                    genre: info.genre || '',
                    created_at: new Date(info.created_at).toLocaleDateString(),
                    artwork: info.artwork_url?.replace('-large', '-t500x500') || info.user.avatar_url,
                    waveform_url: info.waveform_url,
                    stats: {
                        plays: info.playback_count || 0,
                        likes: info.likes_count || 0,
                        reposts: info.reposts_count || 0,
                        comments: info.comment_count || 0
                    },
                    author: {
                        name: info.user.username,
                        username: info.user.permalink,
                        avatar: info.user.avatar_url,
                        followers: info.user.followers_count,
                        tracks: info.user.track_count
                    }
                },
                downloads: [{
                    type: 'audio',
                    url: this.url,
                    filename: `${info.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${info.id}.mp3`
                }]
            };

         //   console.log('Formatted Result:', result); // Debug
            return result;

        } catch (error) {
            console.error('SoundCloud Download Error:', error);
            throw new Error('Gagal mengunduh dari SoundCloud: ' + error.message);
        }
    }

    async downloadAudio() {
        try {
            const stream = await scdl.download(this.url, this.CLIENT_ID);
        
            const chunks = [];
            const audioBuffer = await new Promise((resolve, reject) => {
                stream.on('data', chunk => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });

            return audioBuffer;
        } catch (error) {
            console.error('Audio Download Error:', error);
            throw new Error('Gagal mengunduh audio: ' + error.message);
        }
    }
}

module.exports = SoundCloudDownloader;
