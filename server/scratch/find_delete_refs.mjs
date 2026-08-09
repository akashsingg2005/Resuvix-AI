import fs from 'fs';
import path from 'path';

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.html')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes('delete') && line.includes('resumes')) {
                    console.log(`${fullPath}:${idx + 1}: ${line.trim()}`);
                }
            });
        }
    }
}

searchDir('D:/Resuvix-AI/client');
