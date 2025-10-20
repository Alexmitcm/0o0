<?php
// Simple script to generate a password hash
$password = "12345678";
$hash = password_hash($password, PASSWORD_DEFAULT);

echo "Password: $password\n";
echo "Hash: $hash\n";

// Verify it works
$verify = password_verify($password, $hash);
echo "Verification: " . ($verify ? "SUCCESS" : "FAILED") . "\n";
?> 