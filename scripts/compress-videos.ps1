param (
    [Parameter(Mandatory=$false)]
    [switch]$WithAudio = $false,
    [Parameter(Mandatory=$false)]
    [string]$Preset = "slower",
    [Parameter(Mandatory=$false)]
    [string]$Source = "public\real-content"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$sourceDir = $Source
$extensions = @(".mp4", ".mov", ".MOV", ".mkv", ".webm")

$files = Get-ChildItem -Path $sourceDir -Recurse | Where-Object { $extensions -contains $_.Extension }

# Find local FFmpeg
$ffmpegPath = Get-ChildItem -Path "node_modules/ffmpeg-static" -Filter "ffmpeg.exe" -Recurse | Select-Object -First 1 -ExpandProperty FullName
if (-not $ffmpegPath) {
    $ffmpegPath = Get-ChildItem -Path "bin\ffmpeg" -Filter "ffmpeg.exe" -Recurse | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $ffmpegPath) { $ffmpegPath = "ffmpeg" }


foreach ($file in $files) {
    if ($file.Name.Contains(".tmp")) { continue }
    
    $parentDir = $file.DirectoryName
    $baseName = $file.BaseName
    
    # We will output both MP4 (H.264 fallback) and WebM (VP9/AV1) in the same directory
    $tempMp4 = Join-Path $parentDir "$baseName.tmp.mp4"
    $finalMp4 = Join-Path $parentDir "$baseName.mp4"
    $finalWebM = Join-Path $parentDir "$baseName.webm"
    
    Write-Host "`nOptimizing Video: $($file.FullName) ..." -ForegroundColor Cyan
    
    # Compile H.264 MP4 version
    Write-Host "Encoding MP4 fallback..." -ForegroundColor Gray
    $mp4Args = @("-i", $file.FullName, "-vcodec", "libx264", "-crf", "32", "-preset", $Preset, "-movflags", "+faststart")
    if ($WithAudio) {
        $mp4Args += @("-acodec", "aac", "-b:a", "128k")
    } else {
        $mp4Args += @("-an")
    }
    $mp4Args += @("-y", $tempMp4)
    
    # Compile WebM (VP9) version
    Write-Host "Encoding WebM (VP9)..." -ForegroundColor Gray
    $webmArgs = @("-i", $file.FullName, "-vcodec", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-deadline", "good", "-cpu-used", "2")
    if ($WithAudio) {
        $webmArgs += @("-acodec", "libvorbis", "-b:a", "96k")
    } else {
        $webmArgs += @("-an")
    }
    $webmArgs += @("-y", $finalWebM)
    
    try {
        # Run MP4 optimization
        & $ffmpegPath $mp4Args
        # Run WebM optimization
        & $ffmpegPath $webmArgs
        
        if (Test-Path $tempMp4) {
            # Overwrite original MP4 with compressed version
            Remove-Item $file.FullName -Force
            Rename-Item $tempMp4 $file.Name -Force
            Write-Host "Optimized MP4 successfully: $($file.Name)" -ForegroundColor Green
        }
        if (Test-Path $finalWebM) {
            Write-Host "Created WebM successfully: $baseName.webm" -ForegroundColor Green
        }
    } catch {
        Write-Host "Error optimizing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
        if (Test-Path $tempMp4) { Remove-Item $tempMp4 -Force }
    }
}
