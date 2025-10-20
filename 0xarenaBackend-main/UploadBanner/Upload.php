<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Target directory to save files on the server
    $target_dir = "./uploads/";
    $public_url = "https://zeroxarenabackend.onrender.com/UploadBanner/uploads/";

    // Create the uploads directory if it doesn't exist
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0777, true);
    }

    // Function to handle file upload and rename if file exists
    function uploadFile($fileKey, $target_dir, $public_url) {
        $original_file_name = basename($_FILES[$fileKey]["name"]);
        $target_file = $target_dir . $original_file_name;
        $uploadOk = 1;

        $file_name = pathinfo($original_file_name, PATHINFO_FILENAME);
        $file_extension = pathinfo($original_file_name, PATHINFO_EXTENSION);
        $counter = 1;

        while (file_exists($target_file)) {
            $target_file = $target_dir . $file_name . '_' . $counter . '.' . $file_extension;
            $counter++;
        }

        if ($_FILES[$fileKey]["size"] > 2000000) {
            throw new Exception("File is too large. Maximum size is 2MB.");
        }

        $fileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));
        $allowedTypes = array("jpg", "png", "jpeg", "gif");
        if (!in_array($fileType, $allowedTypes)) {
            throw new Exception("Only JPG, JPEG, PNG, & GIF files are allowed.");
        }

        if (move_uploaded_file($_FILES[$fileKey]["tmp_name"], $target_file)) {
            return $public_url . basename($target_file);
        } else {
            throw new Exception("Failed to upload file.");
        }
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'POST':
            if (isset($_FILES['mobileSlide']) && isset($_FILES['desktopSlide'])) {
                try {
                    $mobileSlidePath = uploadFile('mobileSlide', $target_dir, $public_url);
                    $desktopSlidePath = uploadFile('desktopSlide', $target_dir, $public_url);

                    $stmt = $pdo->prepare('INSERT INTO "slides" ("mobile_slide_link", "desktop_slide_link", "created_at") VALUES (?, ?, ?)');
                    $creationDate = date("Y-m-d H:i:s");
                    $stmt->execute([$mobileSlidePath, $desktopSlidePath, $creationDate]);

                    sendJsonResponse([
                        "status" => "success",
                        "message" => "Files uploaded and data saved successfully",
                        "mobileSlide" => $mobileSlidePath,
                        "desktopSlide" => $desktopSlidePath
                    ]);
                } catch (Exception $e) {
                    sendJsonResponse(["status" => "error", "message" => $e->getMessage()], 400);
                }
            } else {
                sendJsonResponse(["status" => "error", "message" => "Both mobile and desktop slides are required"], 400);
            }
            break;

        case 'GET':
            $stmt = $pdo->query('SELECT * FROM "slides"');
            $slides = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendJsonResponse($slides);
            break;

        case 'DELETE':
            $data = getJsonInput();
            $id = $data['id'] ?? null;

            if ($id) {
                $stmt = $pdo->prepare('DELETE FROM "slides" WHERE "id" = ?');
                $stmt->execute([$id]);
                
                if ($stmt->rowCount() > 0) {
                    sendJsonResponse(["status" => "success", "message" => "Record deleted successfully"]);
                } else {
                    sendJsonResponse(["status" => "error", "message" => "No record found with the provided ID"], 404);
                }
            } else {
                sendJsonResponse(["status" => "error", "message" => "ID is required"], 400);
            }
            break;

        default:
            sendJsonResponse(["status" => "error", "message" => "Method not supported"], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(["status" => "error", "message" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(["status" => "error", "message" => $e->getMessage()], 500);
}