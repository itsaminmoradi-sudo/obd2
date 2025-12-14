export function initPidManagerPage(app) {
    const elements = {
        uploadArea: document.getElementById('uploadArea'),
        pidFileInput: document.getElementById('pidFileInput'),
        browseBtn: document.getElementById('browseBtn'),
        pidFileList: document.getElementById('pidFileList')
    };

    let uploadedFiles = [];

    function setupEventListeners() {
        elements.browseBtn.addEventListener('click', () => {
            elements.pidFileInput.click();
        });

        elements.pidFileInput.addEventListener('change', handleFileSelection);

        // Drag and drop functionality
        elements.uploadArea.addEventListener('dragover', handleDragOver);
        elements.uploadArea.addEventListener('dragleave', handleDragLeave);
        elements.uploadArea.addEventListener('drop', handleDrop);
        
        // Click to upload
        elements.uploadArea.addEventListener('click', () => {
            elements.pidFileInput.click();
        });

        // Load existing files on page load
        loadExistingFiles();
    }

    function handleDragOver(e) {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        if (!elements.uploadArea.contains(e.relatedTarget)) {
            elements.uploadArea.classList.remove('dragover');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }

    function handleFileSelection(e) {
        const files = Array.from(e.target.files);
        processFiles(files);
        
        // Clear the input so the same file can be selected again
        elements.pidFileInput.value = '';
    }

    async function processFiles(files) {
        const jsonFiles = files.filter(file => 
            file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
        );

        if (jsonFiles.length === 0) {
            app.showAlert('Please select JSON files only', 'warning');
            return;
        }

        if (jsonFiles.length !== files.length) {
            app.showAlert('Some files were skipped (only JSON files are supported)', 'warning');
        }

        // Upload files one by one
        for (const file of jsonFiles) {
            try {
                await uploadFile(file);
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                app.showAlert(`Failed to upload ${file.name}: ${error.message}`, 'error');
            }
        }

        // Refresh the file list
        await loadExistingFiles();
    }

    async function uploadFile(file) {
        try {
            // Validate file size (max 1MB)
            if (file.size > 1024 * 1024) {
                throw new Error('File size must be less than 1MB');
            }

            // Validate JSON file
            try {
                await validateJSON(file);
            } catch (error) {
                throw new Error('Invalid JSON file');
            }

            setUploadingState(true, `Uploading ${file.name}...`);
            
            const result = await app.uploadPIDFile(file);
            
            if (result && result.success !== false) {
                app.showAlert(`${file.name} uploaded successfully`, 'success');
                
                // Add to local list
                uploadedFiles.push({
                    name: result.filename || file.name,
                    size: formatFileSize(file.size),
                    uploaded: new Date().toLocaleString(),
                    description: extractFileDescription(file)
                });
                
                updateFileList();
            } else {
                throw new Error(result?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        } finally {
            setUploadingState(false);
        }
    }

    async function validateJSON(file) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        
        // Basic validation for PID file structure
        if (typeof parsed !== 'object' || parsed === null) {
            throw new Error('Invalid JSON structure');
        }
        
        // Check if it has expected PID file structure
        const hasExpectedFields = 
            parsed.pids || parsed.modes || parsed.manufacturer || 
            parsed.commands || parsed.parameters;
            
        if (!hasExpectedFields) {
            console.warn('File may not be a standard PID file format');
        }
        
        return parsed;
    }

    async function loadExistingFiles() {
        try {
            setLoadingState(true);
            
            // For development, use mock data
            const result = await app.getLoadedPIDFiles();
            
            if (result && result.files) {
                uploadedFiles = result.files;
                updateFileList();
            } else {
                // No files or error, show empty state
                updateFileList();
            }
        } catch (error) {
            console.error('Failed to load PID files:', error);
            // Show empty state on error
            uploadedFiles = [];
            updateFileList();
        } finally {
            setLoadingState(false);
        }
    }

    async function deleteFile(filename) {
        const confirmed = confirm(`Are you sure you want to delete "${filename}"?`);
        if (!confirmed) return;

        try {
            setDeletingState(true, `Deleting ${filename}...`);
            
            const result = await app.deletePIDFile(filename);
            
            if (result && result.success !== false) {
                // Remove from local list
                uploadedFiles = uploadedFiles.filter(file => file.name !== filename);
                updateFileList();
                app.showAlert(`${filename} deleted successfully`, 'success');
            } else {
                throw new Error(result?.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            app.showAlert(`Failed to delete ${filename}: ${error.message}`, 'error');
        } finally {
            setDeletingState(false);
        }
    }

    function updateFileList() {
        elements.pidFileList.innerHTML = '';

        if (uploadedFiles.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'pid-item placeholder';
            placeholder.innerHTML = '<p>No PID files loaded</p>';
            elements.pidFileList.appendChild(placeholder);
            return;
        }

        uploadedFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'pid-item';
            
            fileItem.innerHTML = `
                <div class="pid-item-info">
                    <div class="pid-item-name">${file.name}</div>
                    <div class="pid-item-details">
                        Size: ${file.size} | Uploaded: ${file.uploaded}
                        ${file.description ? `<br>Description: ${file.description}` : ''}
                    </div>
                </div>
                <div class="pid-item-actions">
                    <button class="btn btn-sm btn-secondary download-btn" data-filename="${file.name}">Download</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-filename="${file.name}">Delete</button>
                </div>
            `;

            // Add event listeners
            const deleteBtn = fileItem.querySelector('.delete-btn');
            const downloadBtn = fileItem.querySelector('.download-btn');
            
            deleteBtn.addEventListener('click', () => deleteFile(file.name));
            downloadBtn.addEventListener('click', () => downloadFile(file));

            elements.pidFileList.appendChild(fileItem);
        });
    }

    function downloadFile(file) {
        // In a real implementation, this would download from the server
        // For development, we'll simulate a download
        const link = document.createElement('a');
        link.href = '#';
        link.download = file.name;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Simulate file content
        const mockContent = {
            manufacturer: "Honda",
            model: "Civic 2018",
            pids: {
                "010C": { name: "Engine RPM", unit: "RPM", formula: "A*4" },
                "010D": { name: "Vehicle Speed", unit: "km/h", formula: "A" },
                "0105": { name: "Coolant Temperature", unit: "°C", formula: "A-40" }
            }
        };
        
        const blob = new Blob([JSON.stringify(mockContent, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        app.showAlert(`Downloaded ${file.name}`, 'info');
    }

    function setUploadingState(uploading, message = '') {
        elements.browseBtn.disabled = uploading;
        
        if (uploading) {
            elements.browseBtn.innerHTML = `<span class="spinner"></span>${message || 'Uploading...'}`;
            elements.uploadArea.style.pointerEvents = 'none';
        } else {
            elements.browseBtn.textContent = 'Browse Files';
            elements.uploadArea.style.pointerEvents = 'auto';
        }
    }

    function setDeletingState(deleting, message = '') {
        const deleteBtns = elements.pidFileList.querySelectorAll('.delete-btn');
        const downloadBtns = elements.pidFileList.querySelectorAll('.download-btn');
        
        deleteBtns.forEach(btn => btn.disabled = deleting);
        downloadBtns.forEach(btn => btn.disabled = deleting);
        
        if (deleting) {
            // Find the specific button being used
            const allBtns = [...deleteBtns, ...downloadBtns];
            allBtns.forEach(btn => {
                if (btn.textContent.includes('Delete')) {
                    btn.innerHTML = `<span class="spinner"></span>${message || 'Deleting...'}`;
                }
            });
        } else {
            // Reset all buttons
            deleteBtns.forEach(btn => btn.textContent = 'Delete');
            downloadBtns.forEach(btn => btn.textContent = 'Download');
        }
    }

    function setLoadingState(loading) {
        elements.browseBtn.disabled = loading;
        
        if (loading) {
            elements.browseBtn.innerHTML = '<span class="spinner"></span>Loading...';
        } else {
            elements.browseBtn.textContent = 'Browse Files';
        }
    }

    // Utility functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function extractFileDescription(file) {
        // Try to extract description from filename or file content
        const name = file.name.toLowerCase();
        
        if (name.includes('honda')) {
            return 'Honda PID definitions';
        } else if (name.includes('toyota')) {
            return 'Toyota PID definitions';
        } else if (name.includes('ford')) {
            return 'Ford PID definitions';
        } else if (name.includes('bmw')) {
            return 'BMW PID definitions';
        } else if (name.includes('audi')) {
            return 'Audi PID definitions';
        } else {
            return 'Custom PID definitions';
        }
    }

    // Initialize page
    setupEventListeners();
    
    // Add some sample files for development
    uploadedFiles = [
        {
            name: 'honda_pids.json',
            size: '2.3 KB',
            uploaded: '2024-01-15 10:30:00',
            description: 'Honda Civic 2018 PID definitions'
        },
        {
            name: 'toyota_pids.json',
            size: '1.8 KB',
            uploaded: '2024-01-14 14:22:00',
            description: 'Toyota Corolla PID definitions'
        }
    ];
    updateFileList();
}