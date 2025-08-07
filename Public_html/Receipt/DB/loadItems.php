<?php
header('Content-Type: application/json');

$file = 'items.json';

if (file_exists($file)) {
  $content = file_get_contents($file);
  echo $content;
} else {
  echo json_encode([]);
}
