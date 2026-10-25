const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const htmlPath = path.join(dir, 'html', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('Original length:', html.length);

// Match both <script type="module" crossorigin> and <script type="module">
let scriptStartIdx = html.indexOf('<script type="module" crossorigin>');
let tagLen = '<script type="module" crossorigin>'.length;
if (scriptStartIdx === -1) {
  scriptStartIdx = html.indexOf('<script type="module">');
  tagLen = '<script type="module">'.length;
}

if (scriptStartIdx !== -1) {
  const scriptContentStart = scriptStartIdx + tagLen;
  const scriptEndIdx = html.indexOf('</script>', scriptContentStart);
  if (scriptEndIdx !== -1) {
    const scriptCode = html.slice(scriptContentStart, scriptEndIdx);
    
    // Remove the script tag from head
    html = html.slice(0, scriptStartIdx) + html.slice(scriptEndIdx + '</script>'.length);
    
    // Add fallback UI inside root
    const rootMarker = '<div id="root"></div>';
    const fallbackRoot = `<div id="root"><div id="initial-loading" style="font-family:-apple-system,sans-serif;padding:32px 16px;text-align:center;color:#1e293b;"><div style="font-size:16px;font-weight:700;margin-bottom:8px;">⚡ EVN PoleInspector</div><div style="font-size:13px;color:#64748b;">Đang nạp dữ liệu hệ thống...</div></div></div>`;
    
    // Build clean universal script tag placed after root (NO type="module", NO crossorigin)
    const cleanScript = `\n    <script>\n      (function(){\n        try {\n          ${scriptCode}\n        } catch(err) {\n          console.error('App runtime error:', err);\n          var el = document.getElementById('initial-loading');\n          if (el) el.innerHTML = '<div style=\"color:#b91c1c;background:#fee2e2;padding:16px;border-radius:8px;max-width:400px;margin:20px auto;text-align:left;\"><strong>⚠️ Lỗi khởi động:</strong><br><small>' + (err.stack || err.message || err) + '</small></div>';\n        }\n      })();\n    <\/script>`;
    
    if (html.includes(rootMarker)) {
      html = html.replace(rootMarker, () => fallbackRoot + cleanScript);
      console.log('Successfully moved clean universal script after root!');
    }
  }
}

// Add early error listener to head
const earlyErrorTrap = `<script>
  window.addEventListener('error', function(e) {
    var el = document.getElementById('initial-loading') || document.body;
    if (el) {
      var d = document.createElement('div');
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fee2e2;color:#991b1b;padding:12px;font:12px -apple-system,sans-serif;z-index:999999;border-bottom:2px solid #ef4444;';
      d.innerHTML = '<strong>Lỗi tải:</strong> ' + (e.message || 'Không thể nạp ứng dụng.');
      document.body ? document.body.appendChild(d) : document.documentElement.appendChild(d);
    }
  });
</script>\n  `;

if (!html.includes('earlyErrorTrap')) {
  html = html.replace('<head>', () => '<head>\n  ' + earlyErrorTrap);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Processed length:', html.length);

// Also copy to root EVN-PoleInspector.html and index.html
const rootTarget1 = path.join(dir, '..', 'EVN-PoleInspector.html');
const rootTarget2 = path.join(dir, '..', 'index.html');
const localTarget = path.join(dir, 'EVN-PoleInspector.html');
const distTarget = path.join(dir, 'dist', 'EVN-PoleInspector.html');
const netlifyTarget = path.join(dir, '..', 'dist-netlify', 'EVN-PoleInspector.html');

fs.writeFileSync(rootTarget1, html, 'utf8');
fs.writeFileSync(rootTarget2, html, 'utf8');
fs.writeFileSync(localTarget, html, 'utf8');
if (fs.existsSync(path.join(dir, 'dist'))) fs.writeFileSync(distTarget, html, 'utf8');
if (fs.existsSync(path.join(dir, '..', 'dist-netlify'))) fs.writeFileSync(netlifyTarget, html, 'utf8');

// Clean up temporary html directory
try {
  fs.rmSync(path.join(dir, 'html'), { recursive: true, force: true });
} catch (e) {}

console.log('Successfully copied to EVN-PoleInspector.html and index.html in root & cleaned temporary files!');