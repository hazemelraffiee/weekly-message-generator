#!/bin/bash

# Configuration
OUTPUT_FILE="source_code.txt"
PORT=3456
DEBUG=true

# Create temporary directory
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# File paths
HTML_FILE="$TMP_DIR/index.html"
SERVER_JS="$TMP_DIR/server.js"
SELECTED_FILES="$TMP_DIR/selected.txt"

# Function for debug output
debug() {
    if [[ "$DEBUG" == "true" ]]; then
        echo "[DEBUG] $1"
    fi
}

# Collect all files using git ls-files
echo "Collecting files..."
file_list=$(git ls-files --exclude-standard)

# Get unique files
unique_files=$(echo "$file_list" | sort | uniq | grep -v "^$")
file_count=$(echo "$unique_files" | wc -l)
echo "Found $file_count files matching patterns"

# Create the HTML file
cat > "$HTML_FILE" << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>File Selector</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.6;
            background-color: #121212;
            color: #e0e0e0;
        }
        .header {
            background-color: #1a1a1a;
            padding: 12px 20px;
            border-bottom: 1px solid #333;
        }
        .header h1 {
            margin: 0;
            padding: 0;
            font-size: 22px;
            font-weight: 500;
            color: #8cb4ff;
        }
        .search-bar {
            background-color: #1a1a1a;
            padding: 12px 20px;
            display: flex;
            gap: 10px;
            border-bottom: 1px solid #333;
        }
        .search {
            flex-grow: 1;
            padding: 8px 12px;
            font-size: 14px;
            background-color: #2d2d2d;
            color: #e0e0e0;
            border: 1px solid #444;
            border-radius: 4px;
            outline: none;
        }
        .search:focus {
            border-color: #666;
        }
        .search::placeholder {
            color: #888;
        }
        .btn {
            padding: 8px 12px;
            font-size: 14px;
            background-color: #2d2d2d;
            color: #e0e0e0;
            border: 1px solid #444;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .btn:hover {
            background-color: #3d3d3d;
        }
        .btn-primary {
            background-color: #2c5282;
            border-color: #3182ce;
        }
        .btn-primary:hover {
            background-color: #2b6cb0;
        }
        .container {
            display: flex;
            height: calc(100vh - 125px);
        }
        .files-panel {
            flex: 2;
            overflow: auto;
            border-right: 1px solid #333;
            padding: 10px 0;
        }
        .selected-panel {
            flex: 1;
            overflow: auto;
            padding: 10px 20px;
        }
        .folder, .file {
            padding: 6px 8px;
            margin: 2px 0;
            cursor: pointer;
            white-space: nowrap;
            display: flex;
            align-items: center;
            border-radius: 4px;
            transition: background-color 0.15s, padding-left 0.15s;
        }
        
        .folder:hover, .file:hover {
            background-color: #2a2a2a;
            padding-left: 12px;
        }
        
        .folder-icon, .file-icon {
            width: 20px;
            text-align: center;
            margin-right: 8px;
            color: #888;
            transition: transform 0.2s, color 0.2s;
        }
        
        .folder-name, .file-name {
            flex-grow: 1;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .folder-select {
            cursor: pointer;
            padding: 0 6px;
            color: #888;
            transition: color 0.2s;
        }
        
        .folder-select:hover {
            color: #fff;
        }
        
        .folder-content {
            margin-left: 12px;
            display: none;
            border-left: 1px dotted #444;
            padding-left: 10px;
            margin-top: 2px;
            margin-bottom: 2px;
            transition: all 0.2s;
        }
        
        .open > .folder-content {
            display: block;
        }
        
        .open > .folder-icon {
            transform: rotate(90deg);
            color: #8cb4ff;
        }
        
        .folder:hover > .folder-icon {
            color: #8cb4ff;
        }
        
        .file.selected {
            background-color: #2d4a77;
            box-shadow: 0 0 0 1px #3182ce;
        }
        
        .file-extension {
            padding: 0 6px;
            margin-left: 4px;
            font-size: 10px;
            color: #888;
            background-color: #2c2c2c;
            border-radius: 3px;
            border: 1px solid #444;
        }
        
        /* Different colors for different file types */
        .file-extension.js {
            color: #f0db4f;
            background-color: #2c2c2c;
        }
        
        .file-extension.html, .file-extension.htm {
            color: #e34c26;
            background-color: #2c2c2c;
        }
        
        .file-extension.css {
            color: #264de4;
            background-color: #2c2c2c;
        }
        
        .file-extension.json {
            color: #f0ad4e;
            background-color: #2c2c2c;
        }
        
        .file-extension.md {
            color: #61dafb;
            background-color: #2c2c2c;
        }
        
        .file-extension.py {
            color: #3572A5;
            background-color: #2c2c2c;
        }
        
        .file-extension.rb {
            color: #CC342D;
            background-color: #2c2c2c;
        }
        
        .file-extension.go {
            color: #00ADD8;
            background-color: #2c2c2c;
        }
        
        .selected-list li {
            padding: 6px 8px;
            margin-bottom: 6px;
            border-bottom: 1px solid #333;
            border-radius: 3px;
            background-color: #2a2a2a;
        }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
</head>
<body>
    <div class="header">
        <h1>File Selector</h1>
    </div>
    
    <div class="search-bar">
        <input type="text" id="search" class="search" placeholder="Search files...">
        <button class="btn" id="selectAll">Select All Files</button>
    </div>
    
    <div class="container">
        <div class="files-panel" id="files"></div>
        <div class="selected-panel">
            <h3>Selected Files (<span id="count">0</span>)</h3>
            <div id="selected"></div>
        </div>
    </div>
    
    <div class="footer">
        <div class="file-count">Found <span id="totalCount">0</span> files</div>
        <div>
            <button class="btn" id="clear">Clear All</button>
            <button class="btn btn-primary" id="confirm">Concatenate Files</button>
        </div>
    </div>

    <script>
        // Will be replaced with actual file list as JSON
        const files = [__FILE_LIST_PLACEHOLDER__];
        const selectedFiles = new Set();
        
        // Build folder structure
        function buildFolderStructure(files) {
            const structure = {};
            
            files.forEach(file => {
                const parts = file.split('/');
                let current = structure;
                
                // Build nested structure
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    
                    if (i === parts.length - 1) {
                        // It's a file
                        current[part] = { isFile: true, path: file };
                    } else {
                        // It's a folder
                        current[part] = current[part] || {};
                    }
                    
                    current = current[part];
                }
            });
            
            return structure;
        }
        
        // Generate HTML for folder structure
        function generateHTML(structure, parentPath = '') {
            let html = '';
            
            // Process folders first
            Object.keys(structure).sort().forEach(name => {
                const item = structure[name];
                const path = parentPath ? `${parentPath}/${name}` : name;
                
                if (!item.isFile) {
                    const hasChildren = Object.keys(item).length > 0;
                    
                    html += `<div class="folder" data-path="${path}">
                        <span class="folder-icon"><i class="fas fa-chevron-right"></i></span>
                        <span class="folder-name"><i class="fas fa-folder"></i> ${name}</span>
                        <span class="folder-select" data-action="select" title="Select all files in this folder">
                            <i class="far fa-square"></i>
                        </span>
                        <div class="folder-content">
                            ${hasChildren ? generateHTML(item, path) : ''}
                        </div>
                    </div>`;
                }
            });
            
            // Then process files
            Object.keys(structure).sort().forEach(name => {
                const item = structure[name];
                
                if (item.isFile) {
                    // Get file extension
                    const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
                    const fileIcon = getFileIcon(extension);
                    
                    html += `<div class="file" data-path="${item.path}">
                        <span class="file-icon"><i class="${fileIcon}"></i></span>
                        <span class="file-name">${name}</span>
                        ${extension ? `<span class="file-extension ${extension}">${extension}</span>` : ''}
                    </div>`;
                }
            });
            
            return html;
        }

        function getFileIcon(extension) {
            const iconMap = {
                'js': 'fab fa-js-square',
                'ts': 'fab fa-js-square',
                'jsx': 'fab fa-react',
                'tsx': 'fab fa-react',
                'html': 'fab fa-html5',
                'htm': 'fab fa-html5',
                'css': 'fab fa-css3-alt',
                'scss': 'fab fa-sass',
                'sass': 'fab fa-sass',
                'json': 'fas fa-code',
                'md': 'fab fa-markdown',
                'txt': 'fas fa-file-alt',
                'pdf': 'fas fa-file-pdf',
                'jpg': 'fas fa-file-image',
                'jpeg': 'fas fa-file-image',
                'png': 'fas fa-file-image',
                'gif': 'fas fa-file-image',
                'svg': 'fas fa-file-image',
                'py': 'fab fa-python',
                'rb': 'fas fa-gem',
                'php': 'fab fa-php',
                'java': 'fab fa-java',
                'c': 'fas fa-file-code',
                'cpp': 'fas fa-file-code',
                'h': 'fas fa-file-code',
                'go': 'fas fa-file-code',
                'sh': 'fas fa-terminal',
                'bash': 'fas fa-terminal',
                'yml': 'fas fa-file-code',
                'yaml': 'fas fa-file-code',
                'xml': 'fas fa-file-code',
                'doc': 'fas fa-file-word',
                'docx': 'fas fa-file-word',
                'xls': 'fas fa-file-excel',
                'xlsx': 'fas fa-file-excel',
                'zip': 'fas fa-file-archive',
                'rar': 'fas fa-file-archive',
                'tar': 'fas fa-file-archive',
                'gz': 'fas fa-file-archive'
            };
            
            return iconMap[extension] || 'fas fa-file';
        }
        
        // Update folder selection state indicators
        function updateFolderSelectionState() {
            document.querySelectorAll('.folder').forEach(folder => {
                const folderPath = folder.dataset.path;
                const filesInFolder = getFilesInFolder(folderPath);
                const folderSelectElem = folder.querySelector('.folder-select');
                
                if (filesInFolder.length === 0) {
                    // No files in this folder
                    folderSelectElem.innerHTML = '<i class="fas fa-ban"></i>';
                    folderSelectElem.dataset.action = 'none';
                    folderSelectElem.title = 'No files in this folder';
                    return;
                }
                
                // Count how many files are selected
                const selectedCount = filesInFolder.filter(file => selectedFiles.has(file)).length;
                
                if (selectedCount === 0) {
                    // None selected
                    folderSelectElem.innerHTML = '<i class="far fa-square"></i>';
                    folderSelectElem.dataset.action = 'select';
                    folderSelectElem.title = 'Select all files in this folder';
                } else if (selectedCount === filesInFolder.length) {
                    // All selected
                    folderSelectElem.innerHTML = '<i class="far fa-check-square"></i>';
                    folderSelectElem.dataset.action = 'deselect';
                    folderSelectElem.title = 'Deselect all files in this folder';
                } else {
                    // Some selected
                    folderSelectElem.innerHTML = '<i class="far fa-minus-square"></i>';
                    folderSelectElem.dataset.action = 'select';
                    folderSelectElem.title = 'Select all files in this folder';
                }
            });
        }
        
        // Get all files in a folder (recursive)
        function getFilesInFolder(folderPath) {
            const result = [];
            const prefix = folderPath + '/';
            
            files.forEach(file => {
                if (file.startsWith(prefix)) {
                    result.push(file);
                }
            });
            
            return result;
        }
        
        // Select or deselect all files in a folder
        function toggleFolderSelection(folderPath, action) {
            const filesInFolder = getFilesInFolder(folderPath);
            
            if (action === 'select') {
                // Select all files in folder
                filesInFolder.forEach(file => {
                    selectedFiles.add(file);
                });
            } else if (action === 'deselect') {
                // Deselect all files in folder
                filesInFolder.forEach(file => {
                    selectedFiles.delete(file);
                });
            }
            
            // Update UI
            document.querySelectorAll('.file').forEach(elem => {
                const path = elem.dataset.path;
                if (selectedFiles.has(path)) {
                    elem.classList.add('selected');
                } else {
                    elem.classList.remove('selected');
                }
            });
            
            updateFolderSelectionState();
            updateSelected();
        }
        
        // Filter files by search term
        function filterFiles(searchTerm) {
            const filtered = files.filter(file => 
                file.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            // Update Select All button text
            const selectAllBtn = document.getElementById('selectAll');
            if (searchTerm) {
                selectAllBtn.textContent = `Select Filtered (${filtered.length})`;
            } else {
                selectAllBtn.textContent = `Select All (${files.length})`;
            }
            
            if (searchTerm) {
                // Just show flat list if searching
                let html = '';
                filtered.forEach(file => {
                    const selected = selectedFiles.has(file) ? 'selected' : '';
                    html += `<div class="file ${selected}" data-path="${file}">
                        <span class="file-icon">•</span>
                        <span class="file-name">${file}</span>
                    </div>`;
                });
                document.getElementById('files').innerHTML = html;
            } else {
                // Show full structure if not searching
                const structure = buildFolderStructure(files);
                document.getElementById('files').innerHTML = generateHTML(structure);
                
                // Re-select any selected files
                document.querySelectorAll('.file').forEach(elem => {
                    if (selectedFiles.has(elem.dataset.path)) {
                        elem.classList.add('selected');
                    }
                });
                
                // Update folder selection indicators
                updateFolderSelectionState();
            }
        }
        
        // Update selected files display
        function updateSelected() {
            const container = document.getElementById('selected');
            const countElem = document.getElementById('count');
            
            countElem.textContent = selectedFiles.size;
            
            if (selectedFiles.size === 0) {
                container.innerHTML = '<p>No files selected</p>';
                return;
            }
            
            let html = '<ul class="selected-list">';
            Array.from(selectedFiles).sort().forEach(file => {
                const fileName = file.split('/').pop();
                const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
                const fileIcon = getFileIcon(extension);
                
                html += `<li>
                    <i class="${fileIcon}"></i> ${file}
                    ${extension ? `<span class="file-extension ${extension}">${extension}</span>` : ''}
                </li>`;
            });
            html += '</ul>';
            
            container.innerHTML = html;
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            // Set total count
            document.getElementById('totalCount').textContent = files.length;
            
            filterFiles('');
            updateSelected();
            updateFolderSelectionState();
            
            // Handle folder and file clicking
            document.getElementById('files').addEventListener('click', e => {
                const folder = e.target.closest('.folder');
                const file = e.target.closest('.file');
                const folderSelect = e.target.closest('.folder-select');
                const folderIcon = e.target.closest('.folder-icon');
                
                // Handle folder select/deselect button click
                if (folderSelect) {
                    const action = folderSelect.dataset.action;
                    if (action !== 'none') {
                        const folderPath = folderSelect.closest('.folder').dataset.path;
                        toggleFolderSelection(folderPath, action);
                    }
                    e.stopPropagation();
                    return;
                }
                
                // Handle folder expand/collapse
                if ((folder && !file && !folderSelect) || folderIcon) {
                    // Get the actual folder if clicking on icon
                    const targetFolder = folder || folderIcon.closest('.folder');
                    targetFolder.classList.toggle('open');
                    
                    e.stopPropagation();
                    return;
                }
                
                // Handle file selection
                if (file) {
                    const path = file.dataset.path;
                    if (selectedFiles.has(path)) {
                        selectedFiles.delete(path);
                        file.classList.remove('selected');
                    } else {
                        selectedFiles.add(path);
                        file.classList.add('selected');
                    }
                    updateSelected();
                    updateFolderSelectionState();
                    e.stopPropagation();
                }
            });
            
            // Handle search
            document.getElementById('search').addEventListener('input', e => {
                filterFiles(e.target.value);
            });
            
            // Handle select all button
            document.getElementById('selectAll').addEventListener('click', () => {
                const searchTerm = document.getElementById('search').value.toLowerCase();
                const filesToSelect = searchTerm 
                    ? files.filter(file => file.toLowerCase().includes(searchTerm)) 
                    : files;
                
                // Add all filtered files to selection
                filesToSelect.forEach(file => {
                    selectedFiles.add(file);
                });
                
                // Update UI
                document.querySelectorAll('.file').forEach(elem => {
                    const path = elem.dataset.path;
                    if (selectedFiles.has(path)) {
                        elem.classList.add('selected');
                    }
                });
                
                updateSelected();
                updateFolderSelectionState();
            });
            
            // Handle clear button
            document.getElementById('clear').addEventListener('click', () => {
                selectedFiles.clear();
                document.querySelectorAll('.file.selected').forEach(elem => {
                    elem.classList.remove('selected');
                });
                updateSelected();
                updateFolderSelectionState();
            });
            
            // Handle confirm button
            document.getElementById('confirm').addEventListener('click', () => {
                if (selectedFiles.size === 0) {
                    alert('Please select at least one file');
                    return;
                }
                
                fetch('/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        files: Array.from(selectedFiles)
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Files selected successfully. You can close this window.');
                        window.close();
                    } else {
                        alert('Error: ' + data.error);
                    }
                })
                .catch(err => {
                    alert('Error saving selection. Please try again.');
                    console.error(err);
                });
            });
        });
    </script>
</body>
</html>
HTML_EOF

# Replace placeholder with actual file list as JSON
file_list_json=$(printf '%s\n' "$unique_files" | sed 's/"/\\"/g' | sed 's/.*/"&"/' | tr '\n' ',' | sed 's/,$//')
sed -i "s|\[__FILE_LIST_PLACEHOLDER__\]|[$file_list_json]|" "$HTML_FILE"

# Create Node.js server
cat > "$SERVER_JS" << 'JS_EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Get parameters from environment
const port = process.env.PORT || 3000;
const htmlFile = process.env.HTML_FILE;
const selectedFilesPath = process.env.SELECTED_FILES;

console.log(`Starting server with config:
  Port: ${port}
  HTML file: ${htmlFile}
  Selected files: ${selectedFilesPath}
`);

// Verify HTML file exists
try {
  fs.accessSync(htmlFile, fs.constants.R_OK);
  console.log(`HTML file exists and is readable: ${htmlFile}`);
} catch (err) {
  console.error(`ERROR: Cannot access HTML file: ${err.message}`);
  process.exit(1);
}

// Create server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  try {
    // Serve HTML file
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      const html = fs.readFileSync(htmlFile, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }
    
    // Handle file selection submission
    if (req.method === 'POST' && req.url === '/save') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          
          if (!Array.isArray(data.files)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid data format' }));
            return;
          }
          
          console.log(`Saving ${data.files.length} selected files to ${selectedFilesPath}`);
          
          // Make sure to add a newline at the end to prevent the last entry from being missed
          const fileContent = data.files.join('\n') + '\n';
          fs.writeFileSync(selectedFilesPath, fileContent);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          
          // Close server after a short delay
          setTimeout(() => {
            console.log('Shutting down server...');
            server.close(() => {
              console.log('Server closed');
              process.exit(0);
            });
          }, 500);
        } catch (err) {
          console.error(`Error processing request: ${err.message}`);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      
      return;
    }
    
    // 404 for anything else
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (err) {
    console.error(`Server error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Server error: ${err.message}`);
  }
});

// Start server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // Open browser
  const command = process.platform === 'win32' 
    ? `start "" "http://localhost:${port}"`
    : process.platform === 'darwin'
      ? `open "http://localhost:${port}"`
      : `xdg-open "http://localhost:${port}"`;
  
  exec(command, (error) => {
    if (error) {
      console.log(`Please open your browser and navigate to http://localhost:${port}`);
    }
  });
});
JS_EOF

# Start server with environment variables
echo "Starting file selector server..."
PORT=$PORT HTML_FILE="$HTML_FILE" SELECTED_FILES="$SELECTED_FILES" node "$SERVER_JS"

# After server has completed, process the selected files
if [[ -f "$SELECTED_FILES" ]]; then
    # Check if file exists but is empty
    if [[ ! -s "$SELECTED_FILES" ]]; then
        echo "No files were selected."
        exit 1
    fi
    
    # Display the contents of the selected files file for debugging
    echo "Selected files (raw content):"
    cat "$SELECTED_FILES" | cat -A  # Shows line endings and special characters
    echo "----------------------------------------"
    
    # Use a more reliable method to read the file
    readarray -t all_files < "$SELECTED_FILES"
    
    # Count actual files (excluding empty lines)
    total_files=0
    for file in "${all_files[@]}"; do
        if [[ -n "$file" ]]; then
            ((total_files++))
        fi
    done
    
    echo "Found $total_files files to process"
    
    # Empty the output file
    > "$OUTPUT_FILE"
    
    echo "Concatenating selected files..."
    file_count=0
    
    for file in "${all_files[@]}"; do
        # Skip empty lines
        if [[ -z "$file" ]]; then
            continue
        fi
        
        # Check if file exists
        if [[ ! -f "$file" ]]; then
            echo "WARNING: File not found: '$file'"
            continue
        fi
        
        echo "Processing: $file"
        echo "// $file" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        ((file_count++))
    done
    
    echo "Concatenation complete. $file_count out of $total_files files processed."
    echo "Output written to $OUTPUT_FILE"
else
    echo "Selected files file doesn't exist. There might have been an error."
    exit 1
fi