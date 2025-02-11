# SelfHost-DL
SelfHost-DL is my project that lets users self-host a simple web downloader with minimal setup. Just run it with Node.js—no third-party services needed. Deploy the files, start the server, and download content easily. Perfect for a lightweight, self-managed solution.


## Supported Platforms
- TikTok
- CapCut
- Xiaohongshu
- Threads
- SoundCloud
 
## Features
- Simple self-hosted web downloader
- Requires only Node.js
- No third-party services needed
- Easy to deploy and use
- Lightweight and fast
- Vercel deployment support

## Screenshot
### Web Interface Example
![Web Interface](https://raw.githubusercontent.com/rdmistra/selfhost-dl/main/img/image.png)

## Deployment Options

## Quick Deploy

### 1. Vercel Deployment (Easiest)
1. Click the "Deploy" button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frdmistra%2Fselfhost-dl)

2. Login/Register to Vercel if needed
3. Wait for automatic deployment
4. Your app is ready to use!

## Notes on Vercel Deployment
When using Vercel deployment, please note that there are limitations: maximum file size of 45MB, execution timeout of 10 seconds (free plan), and no persistent storage. For larger files or longer processing times, consider using local deployment instead.

### 2. Local Installation (Recommend)

#### Prerequisites
- Node.js installed on your server

#### Steps
1. **Clone the repository:**  
   ```sh
   git clone https://github.com/rdmistra/selfhost-dl.git
   cd selfhost-dl
   ```
2. **Install dependencies:**  
   ```sh
   npm install
   ```
3. **Start the server:**  
   ```sh
   npm start
   ```
4. **Access the web:**  
   Open your browser and go to:  
   ```
   http://localhost:<PORT>
   ```

## Development
```sh
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```


## Tech Stack
- Node.js
- Express
- Vercel Serverless Functions (for Vercel deployment)

## License
This project is licensed under the **Apache 2.0 License**.
