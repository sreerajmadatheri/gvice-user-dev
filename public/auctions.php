<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dataFile = 'uploads/auctions/listings.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        $data = file_get_contents($dataFile);
        echo $data;
    } else {
        echo json_encode([]);
    }
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check for image upload
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No image uploaded or upload error.']);
        exit(0);
    }

    $uploadDir = 'uploads/auctions/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileTmpPath = $_FILES['image']['tmp_name'];
    $fileName = $_FILES['image']['name'];
    $fileName = preg_replace("/[^a-zA-Z0-9.-]/", "_", $fileName);
    $newFileName = time() . '_' . $fileName;
    $destPath = $uploadDir . $newFileName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
        $host = $_SERVER['HTTP_HOST'];
        $fileUrl = $protocol . $host . '/' . $destPath;

        // Load existing listings
        $listings = [];
        if (file_exists($dataFile)) {
            $listings = json_decode(file_get_contents($dataFile), true) ?: [];
        }

        // Create new listing
        $newListing = [
            'id' => uniqid(),
            'userEmail' => $_POST['userEmail'] ?? '',
            'name' => $_POST['name'] ?? '',
            'company' => $_POST['company'] ?? 'Registered Company',
            'sector' => $_POST['sector'] ?? 'oil',
            'price' => $_POST['price'] ?? '',
            'specs' => [
                ['label' => 'Condition', 'val' => $_POST['condition'] ?? ''],
                ['label' => 'Location', 'val' => $_POST['location'] ?? '']
            ],
            'description' => $_POST['description'] ?? '',
            'img' => $fileUrl,
            'featured' => false,
            'createdAt' => time() * 1000 // JS timestamp
        ];

        // Add to top of list
        array_unshift($listings, $newListing);

        // Save back to JSON file
        file_put_contents($dataFile, json_encode($listings));

        echo json_encode(['success' => true, 'listing' => $newListing]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file.']);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? '';
    $userEmail = $input['userEmail'] ?? '';

    if (!$id || !$userEmail) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing id or userEmail']);
        exit(0);
    }

    if (file_exists($dataFile)) {
        $listings = json_decode(file_get_contents($dataFile), true) ?: [];
        $foundIndex = -1;
        $imageToDelete = null;

        foreach ($listings as $index => $listing) {
            if ($listing['id'] === $id) {
                if (($listing['userEmail'] ?? '') !== $userEmail) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
                    exit(0);
                }
                $foundIndex = $index;
                
                // Extract filename from URL to delete it
                $urlParts = parse_url($listing['img']);
                if (isset($urlParts['path'])) {
                    $imageToDelete = $_SERVER['DOCUMENT_ROOT'] . $urlParts['path'];
                }
                break;
            }
        }

        if ($foundIndex !== -1) {
            array_splice($listings, $foundIndex, 1);
            file_put_contents($dataFile, json_encode($listings));
            
            // Attempt to delete image
            if ($imageToDelete && file_exists($imageToDelete)) {
                unlink($imageToDelete);
            }
            
            echo json_encode(['success' => true]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Listing not found']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Database empty']);
    }
    exit(0);
}
?>
