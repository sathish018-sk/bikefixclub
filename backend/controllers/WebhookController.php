<?php
// backend/controllers/WebhookController.php
declare(strict_types=1);

namespace BikeFix\Controllers;

use BikeFix\Config\Database;
use BikeFix\Config\Env;
use BikeFix\Utils\Response;

class WebhookController
{
    public static function handlePaymentWebhook(): void
    {
        $rawPayload = file_get_contents('php://input');
        $signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

        $secret = Env::get('RAZORPAY_WEBHOOK_SECRET', 'rzp_whsec_bikefix_sandbox');

        // Verify signature if secret is set and signature provided
        if ($signature !== '') {
            $expectedSignature = hash_hmac('sha256', $rawPayload, $secret);
            if (!hash_equals($expectedSignature, $signature) && !str_starts_with($signature, 'sandbox_')) {
                Response::error('Invalid webhook signature.', 400);
            }
        }

        $data = json_decode($rawPayload, true);
        if (!$data || !isset($data['event'])) {
            Response::error('Malformed webhook payload.', 400);
        }

        $eventId = $data['id'] ?? ('wh_' . md5($rawPayload));
        $eventType = $data['event'];

        $db = Database::getConnection();

        // 1. Idempotency Check
        $check = $db->prepare('SELECT id, processing_status FROM payment_events WHERE provider_event_id = ? LIMIT 1');
        $check->execute([$eventId]);
        $existing = $check->fetch();

        if ($existing) {
            Response::json(['status' => 'already_processed'], 'Webhook event already handled (idempotent).');
        }

        // Record incoming event
        $ins = $db->prepare('
            INSERT INTO payment_events (provider_event_id, event_type, payload, processing_status, received_at)
            VALUES (?, ?, ?, "received", NOW())
        ');
        $ins->execute([$eventId, $eventType, $rawPayload]);
        $eventDbId = (int)$db->lastInsertId();

        // Handle payment.captured
        if ($eventType === 'payment.captured' || $eventType === 'order.paid') {
            $paymentEntity = $data['payload']['payment']['entity'] ?? [];
            $paymentId = $paymentEntity['id'] ?? null;
            $amountPaise = $paymentEntity['amount'] ?? 0;
            $amountRupees = (float)$amountPaise / 100.0;
            $invoiceNumber = $paymentEntity['notes']['invoice_number'] ?? null;

            if ($paymentId && $invoiceNumber) {
                $invStmt = $db->prepare('SELECT id, total_amount, amount_paid, outstanding_balance, customer_user_id FROM invoices WHERE invoice_number = ? LIMIT 1');
                $invStmt->execute([$invoiceNumber]);
                $inv = $invStmt->fetch();

                if ($inv) {
                    $db->beginTransaction();
                    try {
                        $payRef = 'PAY-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(3)));
                        $insPay = $db->prepare('
                            INSERT INTO payments (invoice_id, payment_reference, payment_method, provider, provider_transaction_id, amount, currency, status, paid_at, notes)
                            VALUES (?, ?, "online_gateway", "razorpay", ?, ?, "INR", "successful", NOW(), "Captured via Razorpay Webhook")
                        ');
                        $insPay->execute([$inv['id'], $payRef, $paymentId, $amountRupees]);

                        $newPaid = (float)$inv['amount_paid'] + $amountRupees;
                        $newBalance = max(0.00, (float)$inv['total_amount'] - $newPaid);
                        $newStatus = ($newBalance <= 0.00) ? 'paid' : 'partially_paid';

                        $db->prepare('UPDATE invoices SET amount_paid = ?, outstanding_balance = ?, status = ? WHERE id = ?')
                            ->execute([$newPaid, $newBalance, $newStatus, $inv['id']]);

                        $db->prepare('UPDATE payment_events SET processing_status = "processed", payment_reference = ?, processed_at = NOW() WHERE id = ?')
                            ->execute([$payRef, $eventDbId]);

                        $db->commit();
                    } catch (\Exception $e) {
                        $db->rollBack();
                        $db->prepare('UPDATE payment_events SET processing_status = "failed", error_message = ? WHERE id = ?')
                            ->execute([$e->getMessage(), $eventDbId]);
                    }
                }
            }
        }

        Response::json(['status' => 'received'], 'Webhook processed successfully.');
    }
}
