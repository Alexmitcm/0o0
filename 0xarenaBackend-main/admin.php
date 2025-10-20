<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Query to retrieve all users
    $sql = 'SELECT * FROM "users"';
    $stmt = $pdo->query($sql);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Create arrays to store unique nodes and edges
    $nodes = [];
    $edges = [];
    $addedNodes = []; // To keep track of added nodes

    // Process query results
    if (!empty($users)) {
        foreach ($users as $row) {
            // Check if the walletaddress already exists
            if (!in_array($row['walletaddress'], $addedNodes)) {
                // Add node for the current user
                $nodes[] = "{id: '" . $row['walletaddress'] . "', label: '" . $row['username'] . "', title: 'Wallet Address: " . $row['walletaddress'] . "\\nReferer: " . $row['referer'] . "\\nEmail: " . $row['email'] . "\\nRolePremission: " . $row['RolePremission'] . "\\nCoins: " . $row['coins'] . "\\nTether: " . $row['Tether'] . "\\nCreationDate: " . $row['CreationDate'] . "\\nIs Email Verified: " . $row['isemailverified'] . "', shape: 'box'}";

                // Add the walletaddress to addedNodes array
                $addedNodes[] = $row['walletaddress'];
            }

            // Connect the user to its referer with an edge
            if ($row['referer'] !== null) {
                $edges[] = "{from: '" . $row['referer'] . "', to: '" . $row['walletaddress'] . "', arrows: {to: {enabled: true, scaleFactor: 1}}}";
            }
        }
    }
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    $nodes = [];
    $edges = [];
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
            position: relative; /* Required for absolute positioning of search box */
        }

        #network {
            width: 100%;
            height: calc(100vh - 40px); /* Adjust height for search box */
        }

        /* Custom style for SweetAlert */
        .swal2-popup {
            width: max-content;
            font-family: 'Arial', sans-serif;
            text-align: left; /* Set text direction to LTR */
        }

        .swal2-content ul {
            padding-left: 20px; /* Add indentation for bullet points */
        }

        .swal2-html-container ul {
            line-height:1.6;
            font-size: medium !important; /* Set font size */
            text-align: left !important; /* Set text direction to LTR */
        }

        /* Style for search box */
        #search-box {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 40px;
            background-color: #f2f2f2;
            padding: 5px;
            box-sizing: border-box;
            z-index: 99999; /* Set z-index to ensure it's on top */
        }
        #layout-options {
    position: absolute;
    top: 40px; /* Adjust this value to position it below the search box */
    left: 0;
    width: 100%;
    background-color: #f2f2f2;
    padding: 10px;
    box-sizing: border-box;
    z-index: 99998; /* Slightly lower than the search box */
}

#layout-options label {
    display: block;
    margin: 5px 0;
}

    </style>
</head>
<body>
<div id="layout-options">
    <label>Level Separation: <input type="number" id="level-separation" value="2600"></label>
    <label>Node Spacing: <input type="number" id="node-spacing" value="500"></label>
    <label>Tree Spacing: <input type="number" id="tree-spacing" value="500"></label>
    <label>
        Direction:
        <select id="direction">
            <option value="UD">Up-Down</option>
            <option value="DU">Down-Up</option>
            <option value="LR">Left-Right</option>
            <option value="RL">Right-Left</option>
        </select>
    </label>
    <button onclick="updateLayout()">Update Layout</button>
</div>


<div id="search-box">
    <input type="text" id="search-input" placeholder="Search by wallet address or username">
    <button onclick="search()">Search</button>
</div>

<div id="network"></div>

<script>
    var nodesData; // Store original node data
    var options;

  // Define the initial color palette
var nodeBorderColor = '#989681';
var edgeColor = '#989681';

// Create nodes and edges arrays with initial colors
var nodes = [<?php echo implode(',', $nodes); ?>];
nodes.forEach(function(node) {
    node.color = { border: nodeBorderColor };
});
var edges = [<?php echo implode(',', $edges); ?>];
edges.forEach(function(edge) {
    edge.color = edgeColor;
});


    // Store original node data
    nodesData = nodes.slice(0);

    // Create a network
    var container = document.getElementById('network');
    var data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    options = {
    layout: {
        hierarchical: {
     
            direction: 'UD', // Up-Down layout
     
        }
    }
};


    var network = new vis.Network(container, data, options);

    // Add a click event listener to show the user information in a SweetAlert component
    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            var nodeId = params.nodes[0];
            var node = network.body.nodes[nodeId];

            // Extract username, wallet address, referer, email, RolePremission, coins, Tether, CreationDate, and isemailverified
            var titleLines = node.options.title.split("\n");
            var username = node.options.label;
            var walletAddress = (titleLines[0] && titleLines[0].indexOf('Wallet Address: ') === 0) ? titleLines[0].replace('Wallet Address: ', '') : 'N/A';
            var referer = (titleLines[1] && titleLines[1].indexOf('Referer: ') === 0) ? titleLines[1].replace('Referer: ', '') : 'N/A';
            var email = (titleLines[2] && titleLines[2].indexOf('Email: ') === 0) ? titleLines[2].replace('Email: ', '') : 'N/A';
            var rolePremission = (titleLines[3] && titleLines[3].indexOf('RolePremission: ') === 0) ? titleLines[3].replace('RolePremission: ', '') : 'N/A';
            var coins = (titleLines[4] && titleLines[4].indexOf('Coins: ') === 0) ? titleLines[4].replace('Coins: ', '') : 'N/A';
            var tether = (titleLines[5] && titleLines[5].indexOf('Tether: ') === 0) ? titleLines[5].replace('Tether: ', '') : 'N/A';
            var creationDate = (titleLines[6] && titleLines[6].indexOf('CreationDate: ') === 0) ? titleLines[6].replace('CreationDate: ', '') : 'N/A';
            var isEmailVerified = (titleLines[7] && titleLines[7].indexOf('Is Email Verified: ') === 0) ? (titleLines[7].replace('Is Email Verified: ', '') === '1' ? 'True' : 'False') : 'N/A';
            
            // Add a $ sign to Tether
            tether = '$' + tether;

            // Use SweetAlert to display the information
            Swal.fire({
                title: 'User Information',
                html: '<ul>' +
                        '<li><strong>Username:</strong> ' + username + '</li>' +
                        '<li><strong>Wallet Address:</strong> ' + walletAddress + '</li>' +
                        '<li><strong>Referer:</strong> ' + referer + '</li>' +
                        '<li><strong>Email:</strong> ' + email + '</li>' +
                        '<li><strong>Role Permission:</strong> ' + rolePremission + '</li>' +
                        '<li><strong>Coins:</strong> ' + coins + '</li>' +
                        '<li><strong>Tether:</strong> ' + tether + '</li>' +
                        '<li><strong>Creation Date:</strong> ' + creationDate + '</li>' +
                        '<li><strong>Is Email Verified:</strong> ' + isEmailVerified + '</li>' +
                      '</ul>',
                icon: 'info',
                customClass: {
                    content: 'custom-swal-content' // Add a custom class for styling
                }
            });
        }
    });

    // Function to search for nodes by wallet address or username
    function search() {
        var searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
        var matchedNodes = [];
        
        // Reset node colors
        nodes.forEach(function (node) {
            node.color = undefined;
        });

        // Reset edge colors
        edges.forEach(function (edge) {
            edge.color = 'blue';
        });

        // Search for matching nodes
        nodesData.forEach(function (node) {
            if (node.label.toLowerCase().includes(searchTerm) || node.id.toLowerCase().includes(searchTerm)) {
                matchedNodes.push(node.id);
                data.nodes.update([{ id: node.id, color: { border: 'red' } }]);
                // Update edge colors for matched nodes
                edges.forEach(function (edge) {
                    if (edge.from === node.id || edge.to === node.id) {
                        edge.color = 'red';
                    }
                });
            }
        });

        // Focus and highlight the first matched node
        if (matchedNodes.length > 0) {
            network.selectNodes([matchedNodes[0]]);
            network.focus(matchedNodes[0], { scale: 1, locked: false, animation: { duration: 1000, easingFunction: 'easeInOutQuad' } });
        } else {
            Swal.fire({
                title: 'Node not found',
                text: 'The searched node was not found.',
                icon: 'error',
                customClass: {
                    content: 'custom-swal-content' // Add a custom class for styling
                }
            });
        }

        // Update edge colors in the network
        data.edges.update(edges);
    }

// Reset node border colors and edge colors when clicked outside the search box
document.addEventListener('click', function (event) {
    var searchBox = document.getElementById('search-box');
    if (event.target !== searchBox && !searchBox.contains(event.target)) {
        nodes.forEach(function (node) {
            node.color = { border: '#989681' }; // Change node border color to #989681
        });
        edges.forEach(function (edge) {
            edge.color = '#989681'; // Reset edge colors to #989681
        });
        data.nodes.update(nodes);
        data.edges.update(edges);
    }
});

function updateLayout() {
    var levelSeparation = parseInt(document.getElementById('level-separation').value);
    var nodeSpacing = parseInt(document.getElementById('node-spacing').value);
    var treeSpacing = parseInt(document.getElementById('tree-spacing').value);
    var direction = document.getElementById('direction').value;

    options.layout.hierarchical.levelSeparation = levelSeparation;
    options.layout.hierarchical.nodeSpacing = nodeSpacing;
    options.layout.hierarchical.treeSpacing = treeSpacing;
    options.layout.hierarchical.direction = direction;

    network.setOptions(options);
}

</script>

</body>
</html>
