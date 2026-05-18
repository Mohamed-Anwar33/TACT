$sourceDir = "public\real-content"
$destDir = "compressed-media\pdfs"
$extension = ".pdf"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force
}

$files = Get-ChildItem -Path $sourceDir -Recurse | Where-Object { $_.Extension -eq $extension }

$report = @()
$totalOldSize = 0
$totalNewSize = 0

Write-Host "`n--- PDF Compression Started (Ghostscript) ---" -ForegroundColor Cyan

foreach ($file in $files) {
    $oldSize = $file.Length / 1MB
    $totalOldSize += $file.Length
    
    $newName = "$($file.BaseName)-compressed.pdf"
    $destPath = Join-Path $destDir $newName
    
    Write-Host "`nProcessing: $($file.Name)..." -ForegroundColor Gray
    
    # Ghostscript Command
    # /ebook is a good balance for web (150 dpi)
    $gsArgs = @(
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/ebook",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-sOutputFile=`"$destPath`"",
        "`"$($file.FullName)`""
    )
    
    $cmd = "gswin64c " + ($gsArgs -join " ")
    
    # Execute Ghostscript
    try {
        Invoke-Expression $cmd
        
        if (Test-Path $destPath) {
            $newFile = Get-Item $destPath
            $newSize = $newFile.Length / 1MB
            $totalNewSize += $newFile.Length
            
            $saving = 100 * (1 - ($newFile.Length / $file.Length))
            
            $report += [PSCustomObject]@{
                FileName = $file.Name
                OldSizeMB = "{0:N2}" -f $oldSize
                NewSizeMB = "{0:N2}" -f $newSize
                Saving = "{0:N2}%" -f $saving
            }
            
            Write-Host "Success: $($file.Name) -> $newName" -ForegroundColor Green
            Write-Host "Saved: $('{0:N2}' -f $saving)%" -ForegroundColor Green
        }
    } catch {
        Write-Host "Error processing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n--- FINAL REPORT ---" -ForegroundColor Cyan
$report | Format-Table -AutoSize

$totalSaving = 100 * (1 - ($totalNewSize / $totalOldSize))
Write-Host "Total Size Before: $('{0:N2}' -f ($totalOldSize / 1MB)) MB" -ForegroundColor White
Write-Host "Total Size After:  $('{0:N2}' -f ($totalNewSize / 1MB)) MB" -ForegroundColor White
Write-Host "Total Saving:      $('{0:N2}' -f $totalSaving) %" -ForegroundColor Green
Write-Host "`nCompressed files are in: $destDir" -ForegroundColor Yellow
