<?php

http_response_code(410);
header("Content-Type: text/plain; charset=utf-8");
echo "db.php is no longer used. Configure MONGODB_URI and use /api/questions instead.";

?>