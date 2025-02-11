const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const downloader = require('./function/downloader');
const axios = require('axios');
const SoundCloudDownloader = require('./function/file/soundcloud');
const app = express();
const PORT = process.env.PORT || 3921;
const TEMP_DIR = path.join(__dirname, 'temp', 'downloads');

async function createTempFile(filename) {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    return path.join(TEMP_DIR, `${Date.now()}-${filename}`);
}

async function cleanupFile(filePath) {
    try {
        await fs.unlink(filePath);
        console.log(`File deleted: ${filePath}`);
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    let tempFilePath = null;
    
    try {
        const { platform, filename } = req.params;
        const { fileUrl } = req.query;

        if (!fileUrl) {
            return res.status(400).json({ error: 'File URL is required' });
        }

        if (platform === 'soundcloud') {
            const soundcloudDL = new SoundCloudDownloader(fileUrl);
            const audioBuffer = await soundcloudDL.downloadAudio();
            
            tempFilePath = await createTempFile(filename);
            await fs.writeFile(tempFilePath, audioBuffer);
            
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', audioBuffer.length);
            
            const fileStream = require('fs').createReadStream(tempFilePath);
            fileStream.pipe(res);
            
            fileStream.on('end', () => {
                cleanupFile(tempFilePath);
            });
            
            return;
        }

        console.log('Downloading:', { platform, filename, fileUrl });

        const response = await axios.get(fileUrl, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.xiaohongshu.com/',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cookie': 'webId=auto;'
            }
        });

        tempFilePath = await createTempFile(filename);
        const writer = require('fs').createWriteStream(tempFilePath);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
            response.data.on('error', reject);
        });

        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        const fileStream = require('fs').createReadStream(tempFilePath);
        fileStream.pipe(res);
        
        fileStream.on('end', () => {
            cleanupFile(tempFilePath);
        });

        fileStream.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to download file' });
            }
            cleanupFile(tempFilePath);
        });

    } catch (error) {
        console.error('Download error:', error);
        
        if (tempFilePath) {
            try {
                await cleanupFile(tempFilePath);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }
        
        if (!res.headersSent) {
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
    }
});

setInterval(async () => {
    try {
        const files = await fs.readdir(TEMP_DIR);
        const now = Date.now();
        
        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);
            const stats = await fs.stat(filePath);

            if (now - stats.mtimeMs > 3600000) {
                await cleanupFile(filePath);
            }
        }
    } catch (error) {
        console.error('Cleanup system error:', error);
    }
}, 3600000);

app.use((err, req, res, next) => {
    console.error(err.stack);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Server error occurred' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
    console.log(`SERVER RUNNING ON http://localhost:${PORT}`);
});