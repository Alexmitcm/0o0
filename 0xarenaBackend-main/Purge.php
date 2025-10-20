<?php
require_once 'config.php';

// Only execute the purge when receiving a POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    setCorsHeaders();
    setErrorHandling();

    try {
        $pdo = getDbConnection();

        // Retrieve description from POST parameters
        $description = $_POST['description'] ?? 'All coins are going to be set to 0 as part of the purge process after burning coins.';

        $pdo->beginTransaction();

        // Update all coins to 0
        $updateStmt = $pdo->prepare('UPDATE "users" SET "coins" = 0');
        $updateStmt->execute();

        // Send notification about the purge process
        $title = 'Purge Process Initiated';
        $priority = 'high';
        $type = 'alert';
        $isAll = 1;

        $stmt = $pdo->prepare('INSERT INTO "Notifications" ("title", "description", "priority", "type", "isAll") VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$title, $description, $priority, $type, $isAll]);

        // Insert into NotificationRecipients with 'empty' as recipient (for isAll)
        $notificationId = $pdo->lastInsertId();
        $stmt = $pdo->prepare('INSERT INTO "NotificationRecipients" ("notification_id", "recipient") VALUES (?, ?)');
        $stmt->execute([$notificationId, 'empty']);

        $pdo->commit();

        echo json_encode(['message' => 'Purge process completed and notification sent']);
        exit;
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'An unexpected error occurred: ' . $e->getMessage()]);
        exit;
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Purge</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #000;
            font-family: 'Arial', sans-serif;
            color: white;
            overflow: hidden;
        }
        
        .container {
            text-align: center;
        }
        
        .title {
            font-size: 3rem;
            margin-bottom: 2rem;
            opacity: 0;
            animation: fadeIn 1s ease-in forwards;
        }
        
        .purge-button {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background-color: #f00;
            color: white;
            font-size: 2rem;
            font-weight: bold;
            border: none;
            cursor: pointer;
            box-shadow: 0 0 20px #f00;
            position: relative;
            overflow: hidden;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .purge-button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px #f00, 0 0 50px #f00;
        }
        
        .purge-button:active {
            transform: scale(0.95);
        }
        
        .purge-button.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .ripple {
            position: absolute;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
        }
        
        @keyframes ripple {
            to {
                transform: scale(2.5);
                opacity: 0;
            }
        }
        
        .message {
            margin-top: 2rem;
            font-size: 1.5rem;
            opacity: 0;
            transform: translateY(20px);
        }
        
        .message.show {
            animation: slideUp 0.5s ease-out forwards;
        }
        
        @keyframes slideUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeIn {
            to {
                opacity: 1;
            }
        }
        
        .purge-animation {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 0, 0, 0.1);
            opacity: 0;
            pointer-events: none;
        }
        
        .purge-animation.active {
            animation: purgeEffect 3s forwards;
        }
        
        @keyframes purgeEffect {
            0% {
                opacity: 0;
            }
            10% {
                opacity: 0.3;
            }
            20% {
                opacity: 0.1;
            }
            30% {
                opacity: 0.5;
            }
            40% {
                opacity: 0.2;
            }
            50% {
                opacity: 0.7;
            }
            60% {
                opacity: 0.4;
            }
            70% {
                opacity: 0.8;
            }
            80% {
                opacity: 0.6;
            }
            90% {
                opacity: 1;
            }
            100% {
                opacity: 0;
            }
        }
        
        .description-input {
            margin-top: 2rem;
            padding: 0.5rem;
            width: 80%;
            max-width: 500px;
            background-color: #111;
            color: white;
            border: 1px solid #333;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">System Purge Protocol</h1>
        
        <button id="purgeButton" class="purge-button">PURGE</button>
        
        <textarea id="purgeDescription" class="description-input" placeholder="Enter purge description (optional)">All coins are going to be set to 0 as part of the purge process after burning coins.</textarea>
        
        <div id="message" class="message"></div>
    </div>
    
    <div id="purgeAnimation" class="purge-animation"></div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const purgeButton = document.getElementById('purgeButton');
            const purgeAnimation = document.getElementById('purgeAnimation');
            const messageElement = document.getElementById('message');
            const descriptionInput = document.getElementById('purgeDescription');
            
            // Add ripple effect
            purgeButton.addEventListener('mousedown', function(event) {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                
                const rect = purgeButton.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                
                purgeButton.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
            
            // Handle purge button click
            purgeButton.addEventListener('click', function() {
                // Disable button during purge
                purgeButton.disabled = true;
                purgeButton.classList.add('disabled');
                
                // Show purge animation
                purgeAnimation.classList.add('active');
                
                // Play keyboard sound (if desired)
                // const audio = new Audio('keyboard_sound.mp3');
                // audio.play();
                
                // Get description
                const description = descriptionInput.value;
                
                // Send purge request
                fetch('Purge.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'description=' + encodeURIComponent(description)
                })
                .then(response => response.json())
                .then(data => {
                    setTimeout(() => {
                        messageElement.textContent = data.message || 'Purge completed successfully!';
                        messageElement.classList.add('show');
                        
                        // Re-enable button after purge
                        setTimeout(() => {
                            purgeButton.disabled = false;
                            purgeButton.classList.remove('disabled');
                        }, 1000);
                    }, 3000); // Show message after animation completes
                })
                .catch(error => {
                    setTimeout(() => {
                        messageElement.textContent = 'Error: ' + error.message;
                        messageElement.classList.add('show');
                        
                        // Re-enable button after error
                        setTimeout(() => {
                            purgeButton.disabled = false;
                            purgeButton.classList.remove('disabled');
                        }, 1000);
                    }, 3000);
                });
                
                // Reset animation state after it completes
                setTimeout(() => {
                    purgeAnimation.classList.remove('active');
                }, 3000);
            });
            
            // Add keyboard trigger
            document.addEventListener('keydown', function(event) {
                // Check if "P" key is pressed
                if (event.key === 'p' || event.key === 'P') {
                    if (!purgeButton.disabled) {
                        purgeButton.click();
                    }
                }
            });
        });
    </script>
</body>
</html>
