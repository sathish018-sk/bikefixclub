<?php
// backend/utils/PdfInvoice.php
declare(strict_types=1);

namespace BikeFix\Utils;

class PdfInvoice
{
    public static function renderHtml(array $invoice): string
    {
        $invNumber = htmlspecialchars($invoice['invoice_number']);
        $jcRef = htmlspecialchars($invoice['job_card_reference']);
        $custName = htmlspecialchars($invoice['customer_name']);
        $custPhone = htmlspecialchars($invoice['customer_phone']);
        $custEmail = htmlspecialchars($invoice['customer_email']);
        $custAddress = htmlspecialchars($invoice['customer_address'] ?? 'Aruppukkottai, Tamil Nadu');
        $bike = htmlspecialchars("{$invoice['bike_brand']} {$invoice['bike_model']}");
        $regNum = htmlspecialchars($invoice['registration_number']);
        $issueDate = htmlspecialchars($invoice['issue_date']);
        $dueDate = htmlspecialchars($invoice['due_date']);
        $status = strtoupper($invoice['status']);

        $subtotal = number_format((float)$invoice['subtotal'], 2);
        $discount = number_format((float)$invoice['discount'], 2);
        $taxRate = number_format((float)$invoice['tax_rate'], 1);
        $taxAmount = number_format((float)$invoice['tax_amount'], 2);
        $totalAmount = number_format((float)$invoice['total_amount'], 2);
        $amountPaid = number_format((float)$invoice['amount_paid'], 2);
        $balance = number_format((float)$invoice['outstanding_balance'], 2);

        $itemsHtml = '';
        foreach ($invoice['items'] as $idx => $item) {
            $num = $idx + 1;
            $typeBadge = $item['item_type'] === 'labour' ? '<span class="badge badge-labour">LABOUR</span>' : '<span class="badge badge-part">SPARE PART</span>';
            $desc = htmlspecialchars($item['description']);
            $qty = number_format((float)$item['quantity'], 1);
            $uPrice = number_format((float)$item['unit_price'], 2);
            $lTotal = number_format((float)$item['line_total'], 2);

            $itemsHtml .= "
                <tr>
                    <td class='text-center'>{$num}</td>
                    <td>{$desc} {$typeBadge}</td>
                    <td class='text-center'>{$qty}</td>
                    <td class='text-right'>₹{$uPrice}</td>
                    <td class='text-right'>₹{$lTotal}</td>
                </tr>
            ";
        }

        $paymentsHtml = '';
        if (!empty($invoice['payments'])) {
            foreach ($invoice['payments'] as $p) {
                $pRef = htmlspecialchars($p['payment_reference']);
                $pMethod = strtoupper(str_replace('_', ' ', $p['payment_method']));
                $pDate = htmlspecialchars(date('d M Y, h:i A', strtotime($p['paid_at'])));
                $pTxn = htmlspecialchars($p['provider_transaction_id'] ?? 'N/A');
                $pAmt = number_format((float)$p['amount'], 2);
                $paymentsHtml .= "
                    <tr>
                        <td>{$pRef}</td>
                        <td>{$pMethod}</td>
                        <td>{$pTxn}</td>
                        <td>{$pDate}</td>
                        <td class='text-right'><strong>₹{$pAmt}</strong></td>
                    </tr>
                ";
            }
        } else {
            $paymentsHtml = '<tr><td colspan="5" class="text-center text-muted">No payments recorded yet.</td></tr>';
        }

        $statusBadgeClass = match ($invoice['status']) {
            'paid' => 'status-paid',
            'partially_paid' => 'status-partial',
            default => 'status-unpaid'
        };

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice #{$invNumber} — BikeFix Club</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #171717; background: #fff; padding: 40px; font-size: 14px; line-height: 1.5; }
        .invoice-box { max-width: 850px; margin: auto; padding: 30px; border: 1px solid #E5E5E5; border-radius: 12px; background: #FFFFFF; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #F97316; margin-bottom: 24px; }
        .brand-title { font-size: 26px; font-weight: 800; color: #111111; letter-spacing: -0.5px; }
        .brand-title span { color: #F97316; }
        .tagline { font-size: 12px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        .workshop-meta { font-size: 13px; color: #404040; margin-top: 8px; line-height: 1.4; }
        .invoice-title-block { text-align: right; }
        .invoice-title-block h1 { font-size: 22px; color: #111111; font-weight: 700; }
        .status-badge { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 700; border-radius: 9999px; text-transform: uppercase; margin-top: 6px; }
        .status-paid { background: #DCFCE7; color: #16A34A; }
        .status-partial { background: #FEF9C3; color: #CA8A04; }
        .status-unpaid { background: #FEE2E2; color: #DC2626; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
        .meta-card { background: #F8F8F8; padding: 16px; border-radius: 8px; border: 1px solid #E5E5E5; }
        .meta-card h3 { font-size: 12px; text-transform: uppercase; color: #737373; margin-bottom: 8px; letter-spacing: 0.5px; }
        .meta-card p { font-size: 13px; color: #171717; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #171717; color: #FFFFFF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #E5E5E5; font-size: 13px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-muted { color: #737373; }
        .badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle; }
        .badge-labour { background: #EFF6FF; color: #2563EB; }
        .badge-part { background: #FFF7ED; color: #EA580C; }
        .totals-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
        .totals-table { width: 340px; }
        .totals-table td { padding: 8px 12px; }
        .grand-total { font-size: 16px; font-weight: 800; color: #111111; background: #FFF7ED; border-top: 2px solid #F97316; }
        .balance-due { font-size: 14px; font-weight: 700; color: #DC2626; }
        .footer-note { text-align: center; font-size: 12px; color: #737373; padding-top: 24px; border-top: 1px solid #E5E5E5; }
        .print-btn-bar { max-width: 850px; margin: 0 auto 20px auto; text-align: right; }
        .btn-print { background: #F97316; color: #fff; border: none; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; }
        .btn-print:hover { background: #EA580C; }
        @media print {
            body { padding: 0; background: #fff; }
            .invoice-box { border: none; padding: 0; }
            .print-btn-bar { display: none; }
        }
    </style>
</head>
<body>
    <div class="print-btn-bar">
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>

    <div class="invoice-box">
        <div class="header">
            <div>
                <div class="brand-title">BikeFix <span>Club</span></div>
                <div class="tagline">Your Bike. Your Club. Our Care.</div>
                <div class="workshop-meta">
                    2/2, RS Puram, Aruppukkottai<br>
                    Mobile: +91 9597881218<br>
                    GSTIN / Tax ID: 33AAECB1234F1Z8
                </div>
            </div>
            <div class="invoice-title-block">
                <h1>TAX INVOICE</h1>
                <p><strong>Invoice #:</strong> {$invNumber}</p>
                <p><strong>Job Card #:</strong> {$jcRef}</p>
                <p><strong>Issue Date:</strong> {$issueDate}</p>
                <p><strong>Due Date:</strong> {$dueDate}</p>
                <span class="status-badge {$statusBadgeClass}">{$status}</span>
            </div>
        </div>

        <div class="meta-grid">
            <div class="meta-card">
                <h3>Billed To (Customer)</h3>
                <p><strong>{$custName}</strong></p>
                <p>Phone: {$custPhone}</p>
                <p>Email: {$custEmail}</p>
                <p>Address: {$custAddress}</p>
            </div>
            <div class="meta-card">
                <h3>Motorcycle Information</h3>
                <p><strong>{$bike}</strong></p>
                <p>Registration: <strong>{$regNum}</strong></p>
                <p>Initial Odometer: {$invoice['initial_odometer']} km</p>
                <p>Final Odometer: {$invoice['final_odometer']} km</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width: 50px;">#</th>
                    <th>Item Description</th>
                    <th class="text-center" style="width: 80px;">Qty</th>
                    <th class="text-right" style="width: 120px;">Unit Price</th>
                    <th class="text-right" style="width: 130px;">Amount</th>
                </tr>
            </thead>
            <tbody>
                {$itemsHtml}
            </tbody>
        </table>

        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right">₹{$subtotal}</td>
                </tr>
                <tr>
                    <td>Discount:</td>
                    <td class="text-right">- ₹{$discount}</td>
                </tr>
                <tr>
                    <td>Applicable GST ({$taxRate}%):</td>
                    <td class="text-right">₹{$taxAmount}</td>
                </tr>
                <tr class="grand-total">
                    <td><strong>Total Amount:</strong></td>
                    <td class="text-right"><strong>₹{$totalAmount}</strong></td>
                </tr>
                <tr>
                    <td>Amount Paid:</td>
                    <td class="text-right" style="color: #16A34A;">₹{$amountPaid}</td>
                </tr>
                <tr class="balance-due">
                    <td>Outstanding Balance:</td>
                    <td class="text-right">₹{$balance}</td>
                </tr>
            </table>
        </div>

        <div style="margin-bottom: 24px;">
            <h3 style="font-size: 13px; text-transform: uppercase; color: #111; margin-bottom: 8px;">Payment Transaction History</h3>
            <table>
                <thead>
                    <tr>
                        <th>Receipt Ref</th>
                        <th>Method</th>
                        <th>Transaction ID</th>
                        <th>Date & Time</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {$paymentsHtml}
                </tbody>
            </table>
        </div>

        <div class="footer-note">
            <p><strong>BikeFix Club — Your Bike. Your Club. Our Care.</strong></p>
            <p>Thank you for your business. For any service queries or warranty concerns, contact us at 9597881218 or visit 2/2, RS Puram, Aruppukkottai.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
