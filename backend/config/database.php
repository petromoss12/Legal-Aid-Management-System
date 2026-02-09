<?php
class Database {
    private $host = "localhost";
    private $db_name = "legal_aid_db";
    private $username = "petro";
    private $password = "mossongo";
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "pgsql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            error_log("Connection error: " . $e->getMessage());
        }

        return $this->conn;
    }
}

