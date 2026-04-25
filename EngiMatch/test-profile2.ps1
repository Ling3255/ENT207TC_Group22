$BASE = "http://127.0.0.1:3000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Login($email, $password) {
    $body = @{ email = $email; password = $password } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$BASE/api/auth/login" -Method POST -Body $body -ContentType "application/json" -WebSession $session -UseBasicParsing
    $data = $res.Content | ConvertFrom-Json
    Write-Host "Login $email`: OK"
    Start-Sleep -Seconds 1
    return $data
}

Write-Host "=== Test: Student home page should NOT show admin card ==="
Login "student@engimatch.com" "123456"
$res = Invoke-WebRequest -Uri "$BASE/home" -WebSession $session -UseBasicParsing
$hasAdmin = $res.Content -match '管理后台|Admin Dashboard'
$hasProfile = $res.Content -match '个人信息|Profile'
Write-Host "Has admin card: $hasAdmin (expect False)"
Write-Host "Has profile link: $hasProfile (expect True)"

Write-Host "`n=== Test: Admin home page SHOULD show admin card ==="
Login "admin@engimatch.com" "123456"
$res = Invoke-WebRequest -Uri "$BASE/home" -WebSession $session -UseBasicParsing
$hasAdmin = $res.Content -match '管理后台|Admin Dashboard'
$hasProfile = $res.Content -match '个人信息|Profile'
Write-Host "Has admin card: $hasAdmin (expect True)"
Write-Host "Has profile link: $hasProfile (expect True)"

Write-Host "`n=== Test: Staff home page (admin card should show) ==="
Login "staff@engimatch.com" "123456"
$res = Invoke-WebRequest -Uri "$BASE/home" -WebSession $session -UseBasicParsing
$hasAdmin = $res.Content -match '管理后台|Admin Dashboard'
Write-Host "Has admin card: $hasAdmin (expect True)"

Write-Host "`n=== Test: Profile page loads ==="
Login "student@engimatch.com" "123456"
$res = Invoke-WebRequest -Uri "$BASE/profile" -WebSession $session -UseBasicParsing
$hasProfileTitle = $res.Content -match '个人信息|Personal Profile'
Write-Host "Profile page loads: $hasProfileTitle (expect True)"

Write-Host "`n=== Test: Profile API returns correct data ==="
$res = Invoke-WebRequest -Uri "$BASE/api/auth/profile" -WebSession $session -UseBasicParsing
$data = ($res.Content | ConvertFrom-Json).data
Write-Host "Email: $($data.email)"
Write-Host "Role: $($data.role)"
Write-Host "Name: $($data.name)"

Write-Host "`n=== All UI tests completed ==="
