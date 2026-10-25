<?php
// backend/utils/Response.php
declare(strict_types=1);

namespace BikeFix\Utils;

class Response
{
    public static function json(mixed $data = null, string $message = 'Operation completed successfully', int $status = 200, bool $success = true): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        $response = [
            'success' => $success,
            'message' => $message,
            'data' => $data,
        ];

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $status = 400, mixed $errors = null): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
