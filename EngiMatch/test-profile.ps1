$BASE = "http://127.0.0.1:3000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Login($email, $password) {
    $body = @{ email = $email; password = $password } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$BASE/api/auth/login" -Method POST -Body $body -ContentType "application/json" -WebSession $session -UseBasicParsing
    $data = $res.Content | ConvertFrom-Json
    Write-Host "Login $email`: $($data.success)"
    return $data
}

function GetProfile {
    $res = Invoke-WebRequest -Uri "$BASE/api/auth/profile" -WebSession $session -UseBasicParsing
    $data = $res.Content | ConvertFrom-Json
    Write-Host "Profile: $($data.data.email) role=$($data.data.role) name=$($data.data.name)"
    return $data
}

function UpdateProfile($name) {
    $body = @{ name = $name } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$BASE/api/auth/profile" -Method PATCH -Body $body -ContentType "application/json" -WebSession $session -UseBasicParsing
    $data = $res.Content | ConvertFrom-Json
    Write-Host "Update name to '$name'`: $($data.success)"
    return $data
}

function ChangePassword($current, $new) {
    $body = @{ currentPassword = $current; newPassword = $new } | ConvertTo-Json
    try {
        $res = Invoke-WebRequest -Uri "$BASE/api/auth/password" -Method POST -Body $body -ContentType "application/json" -WebSession $session -UseBasicParsing
        $data = $res.Content | ConvertFrom-Json
        Write-Host "Change password`: $($data.data.message)"
    } catch {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Change password failed`: $($err.data.error)"
    }
}

Write-Host "=== Test 1: Student login + profile ==="
Login "student@engimatch.com" "123456"
GetProfile
UpdateProfile "王小明 Updated"
GetProfile

Write-Host "`n=== Test 2: Admin login + profile ==="
Login "admin@engimatch.com" "123456"
GetProfile
UpdateProfile "超级管理员 Updated"

Write-Host "`n=== Test 3: Staff login + profile ==="
Login "staff@engimatch.com" "123456"
GetProfile

Write-Host "`n=== Test 4: Change password (student) ==="
Login "student@engimatch.com" "123456"
ChangePassword "123456" "newpass123"
Login "student@engimatch.com" "newpass123"
ChangePassword "newpass123" "123456"
Login "student@engimatch.com" "123456"

Write-Host "`n=== Test 5: Wrong current password ==="
ChangePassword "wrongpass" "newpass123"

Write-Host "`n=== Test 6: Student home page should NOT show admin card ==="
$res = Invoke-WebRequest -Uri "$BASE/home" -WebSession $session -UseBasicParsing
if ($res.Content -match '管理后台|Admin Dashboard') {
    Write-Host "FAIL: Admin card found on student home"
} else {
    Write-Host "PASS: No admin card on student home"
}

Write-Host "`n=== Test 7: Admin home page SHOULD show admin card ==="
Login "admin@engimatch.com" "123456"
$res = Invoke-WebRequest -Uri "$BASE/home" -WebSession $session -UseBasicParsing
if ($res.Content -match '管理后台|Admin Dashboard') {
    Write-Host "PASS: Admin card found on admin home"
} else {
    Write-Host "FAIL: No admin card on admin home"
}

Write-Host "`n=== Test 8: Profile page accessible ==="
$res = Invoke-WebRequest -Uri "$BASE/profile" -WebSession $session -UseBasicParsing
if ($res.Content -match '个人信息|Personal Profile') {
    Write-Host "PASS: Profile page loads"
} else {
    Write-Host "FAIL: Profile page not loading"
}

Write-Host "`n=== All tests completed ==="
