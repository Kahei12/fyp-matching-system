$content = Get-Content "C:\Users\user\Desktop\FYP Matching System\client\src\pages\Teacher.css" -Raw
$content = $content -replace 'background: #27ae60;', 'background: #1a1a1a;'
$content = $content -replace 'background: #219653;', 'background: #333333;'
$content = $content -replace 'background: #e74c3c;', 'background: #404040;'
$content = $content -replace 'background: #c0392b;', 'background: #555555;'
Set-Content -Path "C:\Users\user\Desktop\FYP Matching System\client\src\pages\Teacher.css" -Value $content
Write-Host "Done"
