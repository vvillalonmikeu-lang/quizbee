<?php

$host = "localhost";
$user = "root";
$pass = "";
$db = "quizbee";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$message = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $level = $_POST['level'];
    $round = $_POST['round'];
    $question = $_POST['question'];
    $answer = $_POST['answer'];

    // Multiple Choice Inputs
    $choice_a = $_POST['choice_a'] ?? '';
    $choice_b = $_POST['choice_b'] ?? '';
    $choice_c = $_POST['choice_c'] ?? '';
    $choice_d = $_POST['choice_d'] ?? '';

    $sql = "INSERT INTO questions
    (section, difficulty, question, choice_a, choice_b, choice_c, choice_d, answer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        die("SQL Error: " . $conn->error);
    }

    $stmt->bind_param(
        "ssssssss",
        $level,
        $round,
        $question,
        $choice_a,
        $choice_b,
        $choice_c,
        $choice_d,
        $answer
    );

    if ($stmt->execute()) {
        $message = "✅ Question Added Successfully!";
    } else {
        $message = "❌ Failed to Add Question";
    }
}

?>

<!DOCTYPE html>
<html>
<head>

<title>DICT Quiz Admin Panel</title>

<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet">

<style>

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

body{

    font-family:'Orbitron', sans-serif;

    min-height:100vh;

    background:
    linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)),
    url("bg.jpg");

    background-size:cover;
    background-position:center;

    display:flex;
    justify-content:center;
    align-items:center;

    color:white;
}

.container{

    width:90%;
    max-width:800px;

    background:rgba(15,23,42,0.92);

    border:2px solid cyan;

    border-radius:25px;

    padding:40px;

    box-shadow:
    0 0 25px cyan,
    0 0 50px rgba(0,255,255,0.3);

    backdrop-filter:blur(10px);
}

.title{

    text-align:center;
    margin-bottom:30px;
}

.title h1{

    font-size:45px;

    color:#00ffff;

    text-shadow:
    0 0 10px cyan,
    0 0 25px cyan;
}

.title p{

    margin-top:10px;

    color:#94a3b8;

    font-size:14px;
}

.message{

    text-align:center;

    padding:15px;

    margin-bottom:25px;

    border-radius:12px;

    background:#022c22;

    color:#4ade80;

    font-size:18px;

    box-shadow:0 0 15px #22c55e;
}

label{

    display:block;

    margin-bottom:10px;

    margin-top:20px;

    color:#67e8f9;

    font-size:16px;
}

select,
textarea,
input{

    width:100%;

    padding:16px;

    border:none;

    border-radius:15px;

    background:#111827;

    color:white;

    font-size:16px;

    outline:none;

    border:2px solid transparent;

    transition:0.3s;
}

select:focus,
textarea:focus,
input:focus{

    border:2px solid cyan;

    box-shadow:0 0 15px cyan;
}

textarea{

    resize:none;
}

button{

    width:100%;

    margin-top:30px;

    padding:18px;

    border:none;

    border-radius:15px;

    background:linear-gradient(90deg,#00ffff,#00bcd4);

    color:black;

    font-size:20px;

    font-weight:bold;

    cursor:pointer;

    transition:0.3s;

    box-shadow:0 0 20px cyan;
}

button:hover{

    transform:scale(1.03);

    box-shadow:
    0 0 25px cyan,
    0 0 50px cyan;
}

.logo{

    display:flex;
    justify-content:center;
    gap:30px;
    margin-bottom:25px;
}

.logo img{

    width:100px;

    filter:drop-shadow(0 0 15px cyan);
}

.footer{

    margin-top:25px;

    text-align:center;

    color:#64748b;

    font-size:12px;
}

#choicesBox{
    display:none;
}

</style>

</head>

<body>

<div class="container">

    <div class="logo">

        <img src="dict_logo.png">
        <img src="carmona_logo.png">

    </div>

    <div class="title">

        <h1>DICT QUIZ ADMIN</h1>

        <p>Add questions directly into the database</p>

    </div>

    <?php if($message != ""): ?>

    <div class="message">
        <?php echo $message; ?>
    </div>

    <?php endif; ?>

    <form method="POST">

        <label>LEVEL</label>

        <select name="level" required>

            <option value="">Select Level</option>

            <option value="ELEMENTARY">ELEMENTARY</option>

            <option value="HIGH SCHOOL">HIGH SCHOOL</option>

            <option value="SENIOR HIGH SCHOOL">SENIOR HIGH SCHOOL</option>

        </select>

        <label>ROUND</label>

        <select name="round" id="roundSelect" required>

            <option value="">Select Round</option>

            <option value="EASY">EASY</option>

            <option value="INTERMEDIATE">INTERMEDIATE</option>

            <option value="HARD">HARD</option>

            <option value="CLINCHER">CLINCHER</option>

        </select>

        <label>QUESTION</label>

        <textarea
        name="question"
        rows="6"
        placeholder="Type your question here..."
        required></textarea>

        <!-- MULTIPLE CHOICE SECTION -->

        <div id="choicesBox">

            <label>CHOICE A</label>
            <input type="text" name="choice_a">

            <label>CHOICE B</label>
            <input type="text" name="choice_b">

            <label>CHOICE C</label>
            <input type="text" name="choice_c">

            <label>CHOICE D</label>
            <input type="text" name="choice_d">

        </div>

        <label>CORRECT ANSWER</label>

        <input
        type="text"
        name="answer"
        placeholder="Type correct answer..."
        required>

        <button type="submit">
            ADD QUESTION
        </button>

    </form>

    <div class="footer">
        DICT Quiz Bee System
    </div>

</div>

<script>

const roundSelect = document.getElementById("roundSelect");
const choicesBox = document.getElementById("choicesBox");

roundSelect.addEventListener("change", function(){

    if(
        this.value === "EASY" ||
        this.value === "INTERMEDIATE"
    ){
        choicesBox.style.display = "block";
    }
    else{
        choicesBox.style.display = "none";
    }

});

</script>

</body>
</html>