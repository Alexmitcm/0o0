import { Hono } from "hono";
import handleApiError from "../utils/handleApiError";

const htmlInterfaces = new Hono();

// GET /test-api - API testing interface
htmlInterfaces.get("/test-api", async (c) => {
  try {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Tester - 0xArena</title>
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .response-container {
            max-height: 400px;
            overflow-y: auto;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
            padding: 1rem;
        }
        .json-response {
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
        }
        .status-success { color: #28a745; }
        .status-error { color: #dc3545; }
        .loading { opacity: 0.6; }
    </style>
</head>
<body>
    <div class="container mt-4">
        <h1 class="mb-4">API Tester</h1>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Request Configuration</h5>
                    </div>
                    <div class="card-body">
                        <form id="apiForm">
                            <div class="form-group">
                                <label for="endpoint">Endpoint:</label>
                                <select class="form-control" id="endpoint" required>
                                    <option value="">Select an endpoint</option>
                                    <option value="/ping">GET /ping</option>
                                    <option value="/health">GET /health</option>
                                    <option value="/user-management/signup">POST /user-management/signup</option>
                                    <option value="/user-management/signin">POST /user-management/signin</option>
                                    <option value="/user-management/get-user-data">POST /user-management/get-user-data</option>
                                    <option value="/coin-system-enhanced/coin-update">POST /coin-system-enhanced/coin-update</option>
                                    <option value="/tournament-system-enhanced/all">GET /tournament-system-enhanced/all</option>
                                    <option value="/notification-system-enhanced/create">POST /notification-system-enhanced/create</option>
                                    <option value="/admin-panel/login">POST /admin-panel/login</option>
                                    <option value="/analytics/dashboard-stats">GET /analytics/dashboard-stats</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="method">Method:</label>
                                <select class="form-control" id="method">
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="data">Request Data (JSON):</label>
                                <textarea class="form-control" id="data" rows="6" placeholder='{"walletAddress": "0x...", "username": "test"}'></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="headers">Custom Headers (JSON):</label>
                                <textarea class="form-control" id="headers" rows="3" placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'></textarea>
                            </div>
                            
                            <button type="submit" class="btn btn-primary">Send Request</button>
                            <button type="button" class="btn btn-secondary ml-2" onclick="clearForm()">Clear</button>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Response</h5>
                    </div>
                    <div class="card-body">
                        <div id="responseInfo" class="mb-3"></div>
                        <div class="response-container">
                            <div id="responseContent" class="json-response">No request sent yet</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('apiForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const endpoint = document.getElementById('endpoint').value;
            const method = document.getElementById('method').value;
            const dataText = document.getElementById('data').value;
            const headersText = document.getElementById('headers').value;
            
            if (!endpoint) {
                alert('Please select an endpoint');
                return;
            }
            
            try {
                const data = dataText ? JSON.parse(dataText) : undefined;
                const headers = headersText ? JSON.parse(headersText) : {};
                
                // Add default headers
                headers['Content-Type'] = 'application/json';
                
                const response = await fetch(endpoint, {
                    method: method,
                    headers: headers,
                    body: data ? JSON.stringify(data) : undefined
                });
                
                const responseData = await response.json();
                
                // Display response info
                document.getElementById('responseInfo').innerHTML = \`
                    <div class="alert alert-\${response.ok ? 'success' : 'danger'}">
                        <strong>Status:</strong> \${response.status} \${response.statusText}<br>
                        <strong>Time:</strong> \${new Date().toLocaleTimeString()}
                    </div>
                \`;
                
                // Display response content
                document.getElementById('responseContent').textContent = JSON.stringify(responseData, null, 2);
                
            } catch (error) {
                document.getElementById('responseInfo').innerHTML = \`
                    <div class="alert alert-danger">
                        <strong>Error:</strong> \${error.message}
                    </div>
                \`;
                document.getElementById('responseContent').textContent = error.message;
            }
        });
        
        function clearForm() {
            document.getElementById('apiForm').reset();
            document.getElementById('responseInfo').innerHTML = '';
            document.getElementById('responseContent').textContent = 'No request sent yet';
        }
    </script>
</body>
</html>
    `;

    c.header("Content-Type", "text/html");
    return c.html(html);
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /test-origin - CORS testing interface
htmlInterfaces.get("/test-origin", async (c) => {
  try {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CORS Tester - 0xArena</title>
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .test-result {
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 0.25rem;
        }
        .test-success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .test-error { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .test-info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container mt-4">
        <h1 class="mb-4">CORS Tester</h1>
        
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5>Test Cross-Origin Requests</h5>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="targetUrl">Target URL:</label>
                            <input type="text" class="form-control" id="targetUrl" value="http://localhost:8080/ping" placeholder="Enter URL to test">
                        </div>
                        
                        <div class="form-group">
                            <label for="method">Method:</label>
                            <select class="form-control" id="method">
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                                <option value="OPTIONS">OPTIONS</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="headers">Custom Headers:</label>
                            <textarea class="form-control" id="headers" rows="3" placeholder='{"Authorization": "Bearer token"}'></textarea>
                        </div>
                        
                        <button class="btn btn-primary" onclick="testCORS()">Test CORS</button>
                        <button class="btn btn-secondary ml-2" onclick="clearResults()">Clear Results</button>
                    </div>
                </div>
                
                <div id="results" class="mt-4"></div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5>Test Information</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Current Origin:</strong> <span id="currentOrigin"></span></p>
                        <p><strong>User Agent:</strong> <span id="userAgent"></span></p>
                        <p><strong>Test Time:</strong> <span id="testTime"></span></p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Display current information
        document.getElementById('currentOrigin').textContent = window.location.origin;
        document.getElementById('userAgent').textContent = navigator.userAgent;
        document.getElementById('testTime').textContent = new Date().toLocaleString();
        
        async function testCORS() {
            const targetUrl = document.getElementById('targetUrl').value;
            const method = document.getElementById('method').value;
            const headersText = document.getElementById('headers').value;
            
            if (!targetUrl) {
                alert('Please enter a target URL');
                return;
            }
            
            const resultsDiv = document.getElementById('results');
            const testId = Date.now();
            
            // Add loading indicator
            resultsDiv.innerHTML += \`
                <div class="test-result test-info" id="test-\${testId}">
                    <strong>Test \${testId}:</strong> Testing \${method} request to \${targetUrl}...
                </div>
            \`;
            
            try {
                const headers = headersText ? JSON.parse(headersText) : {};
                
                const response = await fetch(targetUrl, {
                    method: method,
                    headers: headers,
                    mode: 'cors'
                });
                
                const responseData = await response.text();
                
                // Update result
                document.getElementById(\`test-\${testId}\`).innerHTML = \`
                    <strong>Test \${testId}:</strong> SUCCESS<br>
                    <strong>Status:</strong> \${response.status} \${response.statusText}<br>
                    <strong>Headers:</strong> \${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}<br>
                    <strong>Response:</strong> \${responseData}
                \`;
                document.getElementById(\`test-\${testId}\`).className = 'test-result test-success';
                
            } catch (error) {
                // Update result
                document.getElementById(\`test-\${testId}\`).innerHTML = \`
                    <strong>Test \${testId}:</strong> ERROR<br>
                    <strong>Error:</strong> \${error.message}<br>
                    <strong>Type:</strong> \${error.name}
                \`;
                document.getElementById(\`test-\${testId}\`).className = 'test-result test-error';
            }
        }
        
        function clearResults() {
            document.getElementById('results').innerHTML = '';
        }
    </script>
</body>
</html>
    `;

    c.header("Content-Type", "text/html");
    return c.html(html);
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /d3-visualization - D3.js visualization interface
htmlInterfaces.get("/d3-visualization", async (c) => {
  try {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D3.js Visualization - 0xArena</title>
    <script src="https://d3js.org/d3.v6.min.js"></script>
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .visualization-container {
            width: 100%;
            height: 600px;
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
            background-color: #f8f9fa;
        }
        .node {
            cursor: pointer;
        }
        .node circle {
            stroke-width: 2px;
        }
        .node text {
            font: 12px sans-serif;
            pointer-events: none;
        }
        .link {
            fill: none;
            stroke: #ccc;
            stroke-width: 1.5px;
        }
        .tooltip {
            position: absolute;
            padding: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 5px;
            pointer-events: none;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container mt-4">
        <h1 class="mb-4">D3.js User Tree Visualization</h1>
        
        <div class="row">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-header">
                        <h5>Controls</h5>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="walletAddress">Wallet Address:</label>
                            <input type="text" class="form-control" id="walletAddress" placeholder="0x...">
                        </div>
                        
                        <div class="form-group">
                            <label for="depth">Tree Depth:</label>
                            <select class="form-control" id="depth">
                                <option value="3">3 levels</option>
                                <option value="5" selected>5 levels</option>
                                <option value="7">7 levels</option>
                                <option value="10">10 levels</option>
                            </select>
                        </div>
                        
                        <button class="btn btn-primary" onclick="loadTree()">Load Tree</button>
                        <button class="btn btn-secondary ml-2" onclick="loadFullTree()">Load Full Tree</button>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5>Statistics</h5>
                    </div>
                    <div class="card-body">
                        <div id="stats"></div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-9">
                <div class="card">
                    <div class="card-header">
                        <h5>Tree Visualization</h5>
                    </div>
                    <div class="card-body">
                        <div id="visualization" class="visualization-container"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let svg, g, tooltip;
        let treeData = null;
        
        // Initialize visualization
        function initVisualization() {
            svg = d3.select("#visualization")
                .append("svg")
                .attr("width", "100%")
                .attr("height", "100%");
            
            g = svg.append("g");
            
            tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);
        }
        
        // Load user tree
        async function loadTree() {
            const walletAddress = document.getElementById('walletAddress').value;
            const depth = document.getElementById('depth').value;
            
            if (!walletAddress) {
                alert('Please enter a wallet address');
                return;
            }
            
            try {
                const response = await fetch(\`/d3-visualization/tree/\${walletAddress}?depth=\${depth}\`);
                const data = await response.json();
                
                if (data.success) {
                    treeData = data.tree;
                    renderTree();
                    updateStats(data);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error loading tree: ' + error.message);
            }
        }
        
        // Load full tree
        async function loadFullTree() {
            try {
                const response = await fetch('/d3-visualization/tree');
                const data = await response.json();
                
                if (data.success) {
                    treeData = data.nodes[0]; // Use first root node
                    renderTree();
                    updateStats(data);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error loading full tree: ' + error.message);
            }
        }
        
        // Render tree
        function renderTree() {
            if (!treeData) return;
            
            // Clear previous visualization
            g.selectAll("*").remove();
            
            const width = document.getElementById('visualization').clientWidth;
            const height = document.getElementById('visualization').clientHeight;
            
            svg.attr("width", width).attr("height", height);
            
            // Create tree layout
            const tree = d3.tree().size([height - 40, width - 40]);
            const root = d3.hierarchy(treeData);
            tree(root);
            
            // Add links
            g.selectAll('.link')
                .data(root.links())
                .enter().append('path')
                .attr('class', 'link')
                .attr('d', d3.linkVertical()
                    .x(d => d.x + 20)
                    .y(d => d.y + 20));
            
            // Add nodes
            const node = g.selectAll('.node')
                .data(root.descendants())
                .enter().append('g')
                .attr('class', 'node')
                .attr('transform', d => \`translate(\${d.x + 20},\${d.y + 20})\`)
                .on('mouseover', showTooltip)
                .on('mouseout', hideTooltip);
            
            // Add circles
            node.append('circle')
                .attr('r', d => Math.max(5, Math.min(20, d.data.totalEq * 2)))
                .style('fill', d => d.data.banned ? '#ff6b6b' : d.data.status === 'Premium' ? '#4ecdc4' : '#95a5a6')
                .style('stroke', d => d.data.banned ? '#e74c3c' : d.data.status === 'Premium' ? '#16a085' : '#7f8c8d')
                .style('stroke-width', 2);
            
            // Add labels
            node.append('text')
                .attr('dy', '.35em')
                .attr('x', d => d.children ? -15 : 15)
                .style('text-anchor', d => d.children ? 'end' : 'start')
                .text(d => d.data.username || d.data.id.slice(0, 8) + '...');
        }
        
        // Show tooltip
        function showTooltip(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            
            tooltip.html(\`
                <strong>\${d.data.username || 'Unknown'}</strong><br/>
                <small>\${d.data.id}</small><br/>
                <strong>Status:</strong> \${d.data.status}<br/>
                <strong>EQ:</strong> \${d.data.totalEq}<br/>
                <strong>Coins:</strong> \${d.data.coins}<br/>
                <strong>Banned:</strong> \${d.data.banned ? 'Yes' : 'No'}
            \`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        }
        
        // Hide tooltip
        function hideTooltip() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        }
        
        // Update statistics
        function updateStats(data) {
            const statsDiv = document.getElementById('stats');
            statsDiv.innerHTML = \`
                <p><strong>Total Users:</strong> \${data.totalUsers || 'N/A'}</p>
                <p><strong>Root Users:</strong> \${data.rootUsers || 'N/A'}</p>
                <p><strong>Tree Depth:</strong> \${data.tree ? getMaxDepth(data.tree) : 'N/A'}</p>
            \`;
        }
        
        // Get maximum depth
        function getMaxDepth(node, depth = 0) {
            if (!node.children || node.children.length === 0) {
                return depth;
            }
            return Math.max(...node.children.map(child => getMaxDepth(child, depth + 1)));
        }
        
        // Initialize on page load
        initVisualization();
    </script>
</body>
</html>
    `;

    c.header("Content-Type", "text/html");
    return c.html(html);
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /vis-network - Vis.js network interface
htmlInterfaces.get("/vis-network", async (c) => {
  try {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vis.js Network - 0xArena</title>
    <script src="https://unpkg.com/vis-network@9.0.0/dist/vis-network.min.js"></script>
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <style>
        #network {
            width: 100%;
            height: 600px;
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
        }
        .controls {
            margin-bottom: 1rem;
        }
        .stats {
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container mt-4">
        <h1 class="mb-4">Vis.js Network Visualization</h1>
        
        <div class="row">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-header">
                        <h5>Controls</h5>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="minEq">Min EQ:</label>
                            <input type="number" class="form-control" id="minEq" min="0" value="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="maxEq">Max EQ:</label>
                            <input type="number" class="form-control" id="maxEq" min="0" value="10">
                        </div>
                        
                        <div class="form-group">
                            <label for="status">Status:</label>
                            <select class="form-control" id="status">
                                <option value="">All</option>
                                <option value="Premium">Premium</option>
                                <option value="Standard">Standard</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="limit">Limit:</label>
                            <select class="form-control" id="limit">
                                <option value="100">100</option>
                                <option value="250">250</option>
                                <option value="500" selected>500</option>
                                <option value="1000">1000</option>
                            </select>
                        </div>
                        
                        <button class="btn btn-primary" onclick="loadNetwork()">Load Network</button>
                        <button class="btn btn-secondary ml-2" onclick="clearNetwork()">Clear</button>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5>Statistics</h5>
                    </div>
                    <div class="card-body">
                        <div id="stats"></div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-9">
                <div class="card">
                    <div class="card-header">
                        <h5>Network Visualization</h5>
                    </div>
                    <div class="card-body">
                        <div id="network"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let network = null;
        let networkData = null;
        
        // Initialize network
        function initNetwork() {
            const container = document.getElementById('network');
            network = new vis.Network(container, {}, {
                nodes: {
                    shape: 'dot',
                    scaling: {
                        min: 10,
                        max: 100,
                        label: {
                            enabled: true,
                            min: 12,
                            max: 20,
                            maxVisible: 20,
                            drawThreshold: 5
                        }
                    }
                },
                edges: {
                    smooth: {
                        type: 'continuous',
                        roundness: 0.2
                    }
                },
                physics: {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 100,
                        updateInterval: 50
                    },
                    barnesHut: {
                        gravitationalConstant: -2000,
                        centralGravity: 0.1,
                        springLength: 95,
                        springConstant: 0.04,
                        damping: 0.09
                    }
                },
                interaction: {
                    hover: true,
                    hoverConnectedEdges: true,
                    selectConnectedEdges: false
                }
            });
        }
        
        // Load network data
        async function loadNetwork() {
            const minEq = document.getElementById('minEq').value;
            const maxEq = document.getElementById('maxEq').value;
            const status = document.getElementById('status').value;
            const limit = document.getElementById('limit').value;
            
            try {
                const params = new URLSearchParams();
                if (minEq) params.append('minEq', minEq);
                if (maxEq) params.append('maxEq', maxEq);
                if (status) params.append('status', status);
                if (limit) params.append('limit', limit);
                
                const response = await fetch(\`/vis-network/network?\${params}\`);
                const data = await response.json();
                
                if (data.success) {
                    networkData = data.network;
                    network.setData(networkData);
                    updateStats(data.stats);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error loading network: ' + error.message);
            }
        }
        
        // Clear network
        function clearNetwork() {
            network.setData({ nodes: [], edges: [] });
            document.getElementById('stats').innerHTML = '';
        }
        
        // Update statistics
        function updateStats(stats) {
            const statsDiv = document.getElementById('stats');
            statsDiv.innerHTML = \`
                <p><strong>Total Nodes:</strong> \${stats.totalNodes}</p>
                <p><strong>Total Edges:</strong> \${stats.totalEdges}</p>
                <p><strong>Premium Nodes:</strong> \${stats.premiumNodes}</p>
                <p><strong>Standard Nodes:</strong> \${stats.standardNodes}</p>
                <p><strong>Banned Nodes:</strong> \${stats.bannedNodes}</p>
                <p><strong>Avg Connections:</strong> \${stats.avgConnections.toFixed(2)}</p>
            \`;
        }
        
        // Initialize on page load
        initNetwork();
    </script>
</body>
</html>
    `;

    c.header("Content-Type", "text/html");
    return c.html(html);
  } catch (error) {
    return handleApiError(c, error);
  }
});

export default htmlInterfaces;
