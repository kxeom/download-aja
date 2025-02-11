const express = require('express');
const cors = require('cors');
const axios = require('axios');
const downloader = require('./function/downloader');
const SoundCloudDownloader = require('./function/file/soundcloud');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3921;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: 'vercel' });
});

app.post('/api/download', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL cannot be empty' });
        }

        console.log('Downloading:', url);
        const result = await downloader.download(url);
        
        res.json(result);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/download/:platform/:filename', async (req, res) => {
    try {
        const { platform, filename } = req.params;
        const { fileUrl } = req.query;

        if (!fileUrl) {
            return res.status(400).json({ error: 'File URL is required' });
        }

        if (platform === 'soundcloud') {
            const soundcloudDL = new SoundCloudDownloader(fileUrl);
            const audioBuffer = await soundcloudDL.downloadAudio();
            
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', audioBuffer.length);
            return res.send(audioBuffer);
        }

        console.log('Downloading:', { platform, filename, fileUrl });

        const response = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.xiaohongshu.com/',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cookie': 'webId=auto;'
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        const fileSizeInMB = response.data.length / (1024 * 1024);
        if (fileSizeInMB > 45) {
            return res.status(413).json({
                error: 'File terlalu besar untuk Vercel (max: 45MB)'
            });
        }

        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(response.data);

    } catch (error) {
        console.error('Download error:', error);
        
        let statusCode = error.response?.status || 500;
        let errorMessage = 'Failed to download file';

        if (error.response) {
            switch (error.response.status) {
                case 403: errorMessage = 'Access denied'; break;
                case 404: errorMessage = 'File not found'; break;
                case 429: errorMessage = 'Too many requests'; break;
            }
        }

        res.status(statusCode).json({
            error: `${errorMessage}: ${error.message}`
        });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Server error occurred' });
});

module.exports = app; 