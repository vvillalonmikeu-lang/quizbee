<?php

header("Content-Type: application/json");

$host = "localhost";
$user = "root";
$pass = "";
$db = "quizbee";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode([
        "error" => "Database connection failed: " . $conn->connect_error
    ]));
}

$sql = "SELECT * FROM questions";

$result = $conn->query($sql);

if (!$result) {
    die(json_encode([
        "error" => "SQL Error: " . $conn->error
    ]));
}

$data = [];

while ($row = $result->fetch_assoc()) {

    $level = $row['section'];
    $round = $row['difficulty'];

    if (!isset($data[$level])) {
        $data[$level] = [];
    }

    if (!isset($data[$level][$round])) {
        $data[$level][$round] = [];
    }

    $data[$level][$round][] = [

        "question" => $row['question'],

        "choice_a" => $row['choice_a'],
        "choice_b" => $row['choice_b'],
        "choice_c" => $row['choice_c'],
        "choice_d" => $row['choice_d'],

        "answer" => $row['answer']
    ];
}

echo json_encode($data, JSON_PRETTY_PRINT);

$conn->close();

?>