<?php
// backend/utils/Validator.php
declare(strict_types=1);

namespace BikeFix\Utils;

class Validator
{
    private array $data;
    private array $errors = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public static function make(array $data): self
    {
        return new self($data);
    }

    public function required(string $field, string $label = ''): self
    {
        $label = $label ?: $field;
        if (!isset($this->data[$field]) || trim((string)$this->data[$field]) === '') {
            $this->errors[$field][] = "The {$label} field is required.";
        }
        return $this;
    }

    public function email(string $field, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && trim((string)$this->data[$field]) !== '') {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field][] = "The {$label} must be a valid email address.";
            }
        }
        return $this;
    }

    public function phone(string $field, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && trim((string)$this->data[$field]) !== '') {
            $cleaned = preg_replace('/[^0-9]/', '', (string)$this->data[$field]);
            if (strlen($cleaned) < 10 || strlen($cleaned) > 13) {
                $this->errors[$field][] = "The {$label} must be a valid 10-digit mobile number.";
            }
        }
        return $this;
    }

    public function minLength(string $field, int $min, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && strlen((string)$this->data[$field]) < $min) {
            $this->errors[$field][] = "The {$label} must be at least {$min} characters.";
        }
        return $this;
    }

    public function numeric(string $field, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field][] = "The {$label} must be a number.";
        }
        return $this;
    }

    public function in(string $field, array $allowed, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !in_array($this->data[$field], $allowed, true)) {
            $this->errors[$field][] = "The selected {$label} is invalid. Allowed: " . implode(', ', $allowed);
        }
        return $this;
    }

    public function date(string $field, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && trim((string)$this->data[$field]) !== '') {
            $d = \DateTime::createFromFormat('Y-m-d', (string)$this->data[$field]);
            if (!($d && $d->format('Y-m-d') === (string)$this->data[$field])) {
                $this->errors[$field][] = "The {$label} must be a valid date in YYYY-MM-DD format.";
            }
        }
        return $this;
    }

    public function fails(): bool
    {
        return !empty($this->errors);
    }

    public function errors(): array
    {
        return $this->errors;
    }

    public function firstError(): string
    {
        foreach ($this->errors as $messages) {
            if (!empty($messages)) {
                return $messages[0];
            }
        }
        return 'Validation failed.';
    }
}
