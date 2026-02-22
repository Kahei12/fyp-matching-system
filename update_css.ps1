$c = Get-Content "c:\Users\user\Desktop\FYP Matching System\client\src\pages\Teacher.css" -Raw
$c = $c -replace 'background: #f8f9fa;[\s\S]*?color: #495057;[\s\S]*?border: 1px solid #ced4da;', 'background: #ffffff; color: #6b7280; border: 1px solid #d1d5db;'
$c = $c -replace 'background: #e9ecef;', 'background: #f3f4f6; border-color: #9ca3af; color: #374151;'
$c = $c -replace 'background: #3498db;[\s\S]*?color: white;[\s\S]*?border: none;', 'background: #3b82f6; color: white; border: none;'
$c = $c -replace 'background: #2980b9;', 'background: #2563eb;'
$c = $c -replace 'padding: 0.75rem 1.5rem;[\s\S]*?font-size: 0.95rem;[\s\S]*?font-weight: 600;', 'padding: 0.6rem 1.25rem; font-size: 0.875rem; font-weight: 500;'
Set-Content -Path "c:\Users\user\Desktop\FYP Matching System\client\src\pages\Teacher.css" -Value $c
