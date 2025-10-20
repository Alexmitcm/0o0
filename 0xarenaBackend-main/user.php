<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

// Check if both GET parameters are set
if (!isset($_GET['walletaddress']) || !isset($_GET['token'])) {
    sendJsonResponse(['error' => 'Access denied'], 403);
}

$walletAddress = $_GET['walletaddress'];
$token = $_GET['token'];

try {
    $pdo = getDbConnection();

    // Prepare and execute the query to check if the parameters correspond to the same record
    $stmt = $pdo->prepare('SELECT * FROM "users" WHERE "walletaddress" = ? AND "token" = ?');
    $stmt->execute([$walletAddress, $token]);

    // Check if a record is found
    if ($stmt->rowCount() == 0) {
        sendJsonResponse(['error' => 'Access denied'], 403);
    }

    // Function to recursively fetch all referrals
    function getAllReferrals($pdo, $walletAddress, &$referrals) {
        $stmt = $pdo->prepare('SELECT "walletaddress" FROM "users" WHERE "referer" = ?');
        $stmt->execute([$walletAddress]);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $referrals[] = $row['walletaddress'];
            getAllReferrals($pdo, $row['walletaddress'], $referrals);
        }
    }

    // Get all direct and indirect referrals
    $allReferrals = [];
    getAllReferrals($pdo, $walletAddress, $allReferrals);

    // Add the main wallet address node
    $mainNode = "{id: '" . $walletAddress . "', label: 'You', title: 'Wallet Address: " . $walletAddress . "', shape: 'circle'}";

    // Query to retrieve user data for specified referrals
    if (!empty($allReferrals)) {
        $placeholders = str_repeat('?,', count($allReferrals) - 1) . '?';
        $sql = 'SELECT "walletaddress", "username", "referer", "email" FROM "users" WHERE "walletaddress" IN (' . $placeholders . ')';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($allReferrals);
    } else {
        $sql = 'SELECT "walletaddress", "username", "referer", "email" FROM "users" WHERE "walletaddress" = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$walletAddress]);
    }

    // Create arrays to store nodes and edges
    $nodes = [$mainNode];
    $edges = [];

    // Process query results
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($result)) {
        foreach ($result as $row) {
            $nodes[] = "{id: '" . $row['walletaddress'] . "', label: '" . $row['username'] . "', title: 'Wallet Address: " . $row['walletaddress'] . "\\nReferer: " . $row['referer'] . "\\nEmail: " . $row['email'] . "', shape: 'box'}";

            if ($row['referer'] !== null) {
                $edges[] = "{from: '" . $row['referer'] . "', to: '" . $row['walletaddress'] . "', arrows: {to: {enabled: true, scaleFactor: 1}}}";
            }
        }
    }
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vis.js Users Graph</title>
    
    <!-- Include Vis.js CSS and JS files -->
    <link rel="stylesheet" href="https://unpkg.com/vis-network@9.0.0/dist/vis-network.min.css">
    <script src="https://unpkg.com/vis-network@9.0.0/dist/vis-network.min.js"></script>
    
    <!-- Include SweetAlert library -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <style>
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
        }

        #network {
            width: 100%;
            height: calc(100vh - 40px);
        }

        .swal2-popup {
            width: max-content;
            font-family: 'Arial', sans-serif;
            text-align: left;
        }

        .swal2-content ul {
            padding-left: 20px;
        }

        .swal2-html-container ul {
            line-height:1.6;
            font-size: medium !important;
            text-align: left !important;
        }

        #search-box {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 40px;
            background-color: #f2f2f2;
            padding: 5px;
            box-sizing: border-box;
            z-index: 99999;
        }
    </style>
</head>
<body>
<div id="search-box">
    <input type="text" id="search-input" placeholder="Search by wallet address or username">
    <button onclick="search()">Search</button>
</div>

<div id="network"></div>

<script>
    // Create nodes and edges arrays
    var nodes = [<?php echo implode(',', $nodes); ?>];
    var edges = [<?php echo implode(',', $edges); ?>];

    // Create a network
    var container = document.getElementById('network');
    var data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    var options = {
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'UD',
                sortMethod: 'directed',
                shakeTowards: 'roots',
                nodeSpacing: 200,
                levelSeparation: 300,
                treeSpacing: 400,
            }
        },
        physics: {
            enabled: true
        },
        interaction: {
            dragNodes: false,
        }
    };

    var network = new vis.Network(container, data, options);

    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            var nodeId = params.nodes[0];
            var node = network.body.nodes[nodeId];

            var titleLines = node.options.title.split("\n");
            var username = node.options.label;
            var walletAddress = (titleLines[0] && titleLines[0].indexOf('Wallet Address: ') === 0) ? titleLines[0].replace('Wallet Address: ', '') : 'N/A';
            var referer = (titleLines[1] && titleLines[1].indexOf('Referer: ') === 0) ? titleLines[1].replace('Referer: ', '') : 'N/A';
            var email = (titleLines[2] && titleLines[2].indexOf('Email: ') === 0) ? titleLines[2].replace('Email: ', '') : 'N/A';

            Swal.fire({
                title: 'User Information',
                html: '<ul>' +
                        '<li><strong>Username:</strong> ' + username + '</li>' +
                        '<li><strong>Wallet Address:</strong> ' + walletAddress + '</li>' +
                        '<li><strong>Referer:</strong> ' + referer + '</li>' +
                        '<li><strong>Email:</strong> ' + email + '</li>' +
                      '</ul>',
                icon: 'info',
                customClass: {
                    content: 'custom-swal-content'
                }
            });
        }
    });

    function search() {
        var searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
        var matchedNodes = [];

        nodes.forEach(function (node) {
            node.color = undefined;
        });

        edges.forEach(function (edge) {
            edge.color = '#000';
        });

        nodes.forEach(function (node) {
            if (node.label.toLowerCase().includes(searchTerm) || node.id.toLowerCase().includes(searchTerm)) {
                matchedNodes.push(node.id);
                node.color = { background: '#ff0', border: '#f00', highlight: { background: '#ff0', border: '#f00' } };
            }
        });

        if (matchedNodes.length > 0) {
            network.selectNodes([matchedNodes[0]]);
            network.focus(matchedNodes[0], { scale: 1, locked: false, animation: { duration: 1000, easingFunction: 'easeInOutQuad' } });
        } else {
            Swal.fire({
                title: 'Node not found',
                text: 'The searched node was not found.',
                icon: 'error',
                customClass: {
                    content: 'custom-swal-content'
                }
            });
        }

        data.nodes.update(nodes);
        data.edges.update(edges);
    }
</script>
</body>
</html>
