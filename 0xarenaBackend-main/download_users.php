<?php
// If this is a download request, fetch users and output as CSV
if (isset($_GET['download']) && $_GET['download'] == '1') {
    $apiUrl = 'https://zeroxarenabackend.onrender.com/GetallUserdata.php'; // Use your real URL

    // Use cURL for better compatibility
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $usersJson = curl_exec($ch);
    curl_close($ch);

    $users = json_decode($usersJson, true);

    if ($users === null) {
        file_put_contents('debug_users.txt', $usersJson); // For debugging
        die('Failed to decode JSON. Raw response saved to debug_users.txt');
    }

    if (!is_array($users)) {
        die('Failed to fetch user data.');
    }

    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="users.csv"');

    $output = fopen('php://output', 'w');

    // Output CSV header
    if (isset($users[0])) {
        fputcsv($output, array_keys($users[0]));
    }

    // Output user rows
    foreach ($users as $user) {
        fputcsv($output, $user);
    }

    fclose($output);
    exit;
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Download Users as Excel</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 400px; margin: auto; text-align: center; }
        button { padding: 12px 24px; font-size: 18px; background: #007bff; color: #fff; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
        table { margin: 30px auto; border-collapse: collapse; width: 100%; max-width: 800px; }
        th, td { border: 1px solid #ccc; padding: 8px; }
        th { background: #f4f4f4; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Export All Users</h2>
        <form method="get">
            <input type="hidden" name="download" value="1">
            <button type="submit">Download Users as Excel</button>
        </form>
        <hr/>
        <h3>Preview Users</h3>
        <div id="user-table"></div>
    </div>
    <script>
    // Fetch and display users in a table
    fetch('GetallUserdata.php')
        .then(res => res.json())
        .then(users => {
            if (!Array.isArray(users) || users.length === 0) {
                document.getElementById('user-table').innerHTML = '<em>No users found.</em>';
                return;
            }
            let table = '<table><thead><tr>';
            Object.keys(users[0]).forEach(key => table += `<th>${key}</th>`);
            table += '</tr></thead><tbody>';
            users.forEach(user => {
                table += '<tr>';
                Object.values(user).forEach(val => table += `<td>${val === null ? '' : val}</td>`);
                table += '</tr>';
            });
            table += '</tbody></table>';
            document.getElementById('user-table').innerHTML = table;
        })
        .catch(() => {
            document.getElementById('user-table').innerHTML = '<em>Failed to load user data.</em>';
        });
    </script>
</body>
</html> 