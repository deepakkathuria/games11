const fs = require('fs');
const path = require('path');

// Function to recursively get image paths
function getAllImagePaths(dir, fileTypes = ['.jpg', '.jpeg', '.png'], fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const fileStat = fs.statSync(filePath);

        if (fileStat.isDirectory()) {
            // Recursively fetch files from subdirectories
            getAllImagePaths(filePath, fileTypes, fileList);
        } else {
            // Check if the file is an image (based on the extension)
            const ext = path.extname(file).toLowerCase();
            if (fileTypes.includes(ext)) {
                fileList.push(filePath); // Add file path to list
            }
        }
    });

    return fileList;
}

// Directory containing BMW models
const galleryDir = path.join('C:', 'Users', 'Bhupi', 'Downloads', 'gallery', 'gallery');

// Fetch all models' image paths dynamically and write to text file
let output = '';

fs.readdir(galleryDir, (err, models) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    models.forEach(model => {
        const modelPath = path.join(galleryDir, model);
        if (fs.statSync(modelPath).isDirectory()) {
            const imagePaths = getAllImagePaths(modelPath);
            output += `Images for ${model}:\n`;
            imagePaths.forEach(imagePath => {
                output += `${imagePath}\n`;
            });
            output += '---------------------------\n';
        }
    });

    // Write the output to a text file
    const outputPath = path.join(__dirname, 'imagePaths.txt');
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(`Image paths have been written to ${outputPath}`);
});
