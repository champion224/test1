<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');


$data = file_get_contents('php://input');
if (!$data) {
  echo json_encode(['status' => 'error', 'message' => 'No data received']);
  exit;
}

$file = 'items.json';

if (is_writable($file) || !file_exists($file)) {
  $result = file_put_contents($file, $data);
  if ($result !== false) {
    echo json_encode(['status' => 'success']);
  } else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to write file']);
  }
} else {
  echo json_encode(['status' => 'error', 'message' => 'File is not writable']);
}
?>
