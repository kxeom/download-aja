async function downloadMedia() {
    const urlInput = document.getElementById('urlInput');
    const resultDiv = document.getElementById('result');
    const mediaPreview = document.getElementById('mediaPreview');
    const loading = document.getElementById('loading');

    if (!urlInput.value) {
        showToast('Mohon masukkan URL', 'error');
        return;
    }

    try {
        loading.classList.remove('hidden');
        resultDiv.classList.add('hidden');
        mediaPreview.innerHTML = ''; 

        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: urlInput.value })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        loading.classList.add('hidden');
        mediaPreview.innerHTML = generatePreviewHTML(data);
        resultDiv.classList.remove('hidden');

    } catch (error) {
        loading.classList.add('hidden');
        showToast(error.message, 'error');
    }
}

function generatePreviewHTML(data) {
    if (!data || !data.downloads || data.downloads.length === 0) {
        return '<div class="p-4 text-center text-gray-500">Media tidak tersedia</div>';
    }

    return `
        <div class="download-item">
            ${data.downloads.map((item, index) => generateSimpleMediaPreview(item, index, data.platform)).join('')}
        </div>
    `;
}

function generateSimpleMediaPreview(item, index, platform) {
    if (!item) return '';

    const safeUrl = item.url.replace(/'/g, "\\'");
    const safeFilename = item.filename.replace(/'/g, "\\'");

    let thumbnailUrl = '';
    if (item.type === 'video') {
        thumbnailUrl = `
            <div class="video-thumbnail relative bg-gray-100">
                <video src="${safeUrl}" class="w-full h-32 sm:h-48 object-cover rounded-t-xl opacity-0" 
                       onloadeddata="this.classList.remove('opacity-0')">
                </video>
                <div class="absolute inset-0 flex items-center justify-center">
                    <i class="fas fa-play-circle text-3xl sm:text-4xl text-indigo-500"></i>
                </div>
            </div>
        `;
    } else if (item.type === 'image') {
        thumbnailUrl = `
            <div class="relative bg-gray-100">
                <img src="${safeUrl}" class="w-full h-32 sm:h-48 object-cover rounded-t-xl opacity-0" 
                     onload="this.classList.remove('opacity-0')"
                     onerror="this.src='https://via.placeholder.com/400x300?text=Preview+Not+Available'">
            </div>
        `;
    } else if (item.type === 'audio') {
        thumbnailUrl = `
            <div class="bg-gray-100 w-full h-32 sm:h-48 flex items-center justify-center rounded-t-xl">
                <i class="fas fa-music text-4xl sm:text-5xl text-indigo-500"></i>
            </div>
        `;
    }

    return `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-4 hover:shadow-lg transition-all duration-300 download-card">
            ${thumbnailUrl}
            <div class="p-4">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                    <div class="flex items-center gap-2 flex-wrap">
                        <i class="fas ${getFileIcon(item.type)} text-indigo-500"></i>
                        <span class="text-sm font-medium">${formatType(item.type)}</span>
                        ${item.quality ? 
                            `<span class="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">${item.quality}</span>` 
                            : ''
                        }
                    </div>
                    <span class="text-xs text-gray-500">${getPlatformIcon(platform)}</span>
                </div>

                <button onclick="downloadFile('${platform}', '${safeUrl}', '${safeFilename}')" 
                        class="download-button w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <i class="fas fa-download"></i>
                    <span>Download</span>
                </button>
            </div>
        </div>
    `;
}

function getVideoThumbnail(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL();
}

function getPlatformIcon(platform) {
    const icons = {
        'tiktok': '<i class="fab fa-tiktok"></i> TikTok',
        'capcut': '<i class="fas fa-video"></i> CapCut',
        'xiaohongshu': '<i class="fas fa-heart"></i> Xiaohongshu',
        'threads': '<i class="fas fa-comment-dots"></i> Threads',
        'soundcloud': '<i class="fab fa-soundcloud"></i> SoundCloud'
    };
    return icons[platform] || '<i class="fas fa-link"></i> Link';
}

function getFileIcon(type) {
    switch (type) {
        case 'video': return 'fa-video';
        case 'image': return 'fa-image';
        case 'audio': return 'fa-music';
        default: return 'fa-file';
    }
}

function formatType(type) {
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'File';
}

function showLoading(show = true) {
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    
    if (show) {
        loading.classList.remove('hidden');
        result.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 px-4 sm:px-6 py-3 rounded-xl shadow-lg text-white transform transition-all duration-300 z-50 text-sm sm:text-base text-center sm:text-left ${
        type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let isDownloading = false;

async function downloadFile(platform, fileUrl, filename) {
    if (isDownloading) return;
    
    const downloadBtn = event.target.closest('button');
    if (!downloadBtn) return;

    try {
        isDownloading = true;
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>Downloading...</span>
        `;

        const encodedFileUrl = encodeURIComponent(fileUrl);
        const encodedFilename = encodeURIComponent(filename);
        const downloadUrl = `/api/download/${platform}/${encodedFilename}?fileUrl=${encodedFileUrl}`;

        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
            throw new Error('Download gagal');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Download berhasil!', 'success');
    } catch (error) {
        console.error("Download error:", error);
        showToast('Gagal mengunduh: ' + error.message, 'error');
    } finally {
        isDownloading = false;
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Download</span>
        `;
    }
}