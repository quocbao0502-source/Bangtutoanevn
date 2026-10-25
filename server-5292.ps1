param(
    [int]$Port = 5292
)

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $baseDir) { $baseDir = Get-Location }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

try {
    $listener.Start()
} catch {
    Write-Error "Không thể mở cổng $Port. Lỗi: $_"
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  MÁY CHỦ EVNSPC ESTIMATE ĐANG CHẠY TẠI LOCALHOST:$Port" -ForegroundColor Cyan
Write-Host "  - Địa chỉ web: http://localhost:$Port" -ForegroundColor Yellow
Write-Host "  - Bản di động: http://localhost:$Port/hotline-estimate.html" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Nhấn Ctrl+C để dừng máy chủ."

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)

            if ($urlPath -eq "/" -or $urlPath -eq "/index.html" -or $urlPath -eq "/hotline-estimate.html") {
                $targetFile = Join-Path $baseDir "hotline-estimate.html"
                $contentType = "text/html; charset=utf-8"
            } elseif ($urlPath -eq "/api/health") {
                $json = '{"status":"ok","port":' + $Port + ',"app":"EVNSPC Estimate Hotline","timestamp":"' + (Get-Date -Format o) + '"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.OutputStream.Close()
                continue
            } else {
                $cleanSubPath = $urlPath.TrimStart('/').Replace('/', '\')
                $targetFile = Join-Path $baseDir $cleanSubPath
                if (-not (Test-Path $targetFile -PathType Leaf)) {
                    $targetFile = Join-Path $baseDir "hotline-estimate.html"
                }

                $ext = [System.IO.Path]::GetExtension($targetFile).ToLower()
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".svg"  { "image/svg+xml" }
                    ".ico"  { "image/x-icon" }
                    Default { "application/octet-stream" }
                }
            }

            if (Test-Path $targetFile -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($targetFile)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } catch {
            # Ignore client disconnect
        } finally {
            try { $response.OutputStream.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}

