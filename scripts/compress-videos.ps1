param (
    [Parameter(Mandatory=$false)]
    [switch]$WithAudio = $false,
    [Parameter(Mandatory=$false)]
    [string]$Preset = "slower",
    [Parameter(Mandatory=$false)]
    [string]$Source = "public\real-content" # Default to originals
)

# Set Output Encoding to UTF8 for Arabic filenames
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$sourceDir = $Source
$destDir = "compressed-media\videos-final" # Save to a final folder to compare
$extensions = @(".mp4", ".mov", ".MOV", ".mkv", ".webm")

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force
}

$files = Get-ChildItem -Path $sourceDir -Recurse | Where-Object { $extensions -contains $_.Extension }

$report = @()
$totalOldSize = 0
$totalNewSize = 0

Write-Host "`n--- Final Ultra Optimization ---" -ForegroundColor Cyan
Write-Host "Source: $sourceDir" -ForegroundColor Yellow
Write-Host "Preset: $Preset" -ForegroundColor Gray

# Find local FFmpeg
$ffmpegPath = Get-ChildItem -Path "bin\ffmpeg" -Filter "ffmpeg.exe" -Recurse | Select-Object -First 1 -ExpandProperty FullName
if (-not $ffmpegPath) { $ffmpegPath = "ffmpeg" }

foreach ($file in $files) {
    $oldSize = $file.Length / 1MB
    $totalOldSize += $file.Length
    
    $newName = if ($file.BaseName.EndsWith("-compressed")) { $file.Name } else { "$($file.BaseName)-compressed.mp4" }
    $destPath = Join-Path $destDir $newName
    
    Write-Host "`nProcessing: $($file.Name)..." -ForegroundColor Gray
    
    # FFmpeg Arguments
    # Using CRF 32 for maximum saving, preset veryslow for best quality/size ratio
    $ffmpegArgs = @("-i", $file.FullName, "-vcodec", "libx264", "-crf", "32", "-preset", $Preset, "-movflags", "+faststart")
    
    if ($WithAudio) {
        $ffmpegArgs += @("-acodec", "aac", "-b:a", "128k")
    } else {
        $ffmpegArgs += @("-an") # No audio
    }
    
    $ffmpegArgs += @("-y", $destPath)
    
    # Execute FFmpeg using Call Operator
    try {
        & $ffmpegPath $ffmpegArgs
        
        if (Test-Path $destPath) {
            $newFile = Get-Item $destPath
            $newSize = $newFile.Length / 1MB
            $totalNewSize += $newFile.Length
            
            $saving = 100 * (1 - ($newFile.Length / $file.Length))
            
            $report += [PSCustomObject]@{
                FileName = $file.Name
                OldMB = "{0:N2}" -f $oldSize
                NewMB = "{0:N2}" -f $newSize
                Saving = "{0:N2}%" -f $saving
            }
            
            Write-Host "Success: $($file.Name) -> $newName" -ForegroundColor Green
            Write-Host "Saved: $('{0:N2}' -f $saving)%" -ForegroundColor Green
        }
    } catch {
        Write-Host "Error processing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n--- FINAL OPTIMIZATION REPORT ---" -ForegroundColor Cyan
$report | Format-Table -AutoSize

$totalSaving = if ($totalOldSize -gt 0) { 100 * (1 - ($totalNewSize / $totalOldSize)) } else { 0 }
Write-Host "Total Size Before: $('{0:N2}' -f ($totalOldSize / 1MB)) MB" -ForegroundColor White
Write-Host "Total Size After:  $('{0:N2}' -f ($totalNewSize / 1MB)) MB" -ForegroundColor White
Write-Host "Total Saving:      $('{0:N2}' -f $totalSaving) %" -ForegroundColor Green
Write-Host "`nCompressed files are in: $destDir" -ForegroundColor Yellow
