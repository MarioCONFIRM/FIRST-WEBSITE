import type { Prisma } from "@/generated/prisma/client";
import { MoneyAmount } from "@/components/dashboard/money-display";

export function deriveDirection(entries: Array<{ entryType: "DEBIT" | "CREDIT" }>): "DEBIT" | "CREDIT" | "MIXED" | null {
  if (entries.length === 0) return null;
  const hasDebit = entries.some((e) => e.entryType === "DEBIT");
  const hasCredit = entries.some((e) => e.entryType === "CREDIT");
  if (hasDebit && hasCredit) return "MIXED";
  if (hasDebit) return "DEBIT";
  if (hasCredit) return "CREDIT";
  return null;
}

export function formatTxType(type: string) {
  switch (type) {
    case "DEPOSIT": return "Deposit";
    case "WITHDRAWAL": return "Withdrawal";
    case "TRANSFER": return "Transfer";
    case "CURRENCY_CONVERSION": return "Currency conversion";
    case "FEE": return "Fee";
    case "REVERSAL": return "Reversal";
    default: return type;
  }
}

export function formatTxStatus(status: string) {
  switch (status) {
    case "PENDING": return "Pending";
    case "PROCESSING": return "Processing";
    case "COMPLETED": return "Completed";
    case "FAILED": return "Failed";
    case "REVERSED": return "Reversed";
    default: return status;
  }
}

export function directionLabel(direction: ReturnType<typeof deriveDirection>) {
  if (direction === "DEBIT") return "Debit";
  if (direction === "CREDIT") return "Credit";
  if (direction === "MIXED") return "Debit/Credit";
  return "—";
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case "COMPLETED": return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "PENDING": return "bg-amber-50 text-amber-900 ring-amber-200";
    case "PROCESSING": return "bg-blue-50 text-blue-800 ring-blue-200";
    case "FAILED": return "bg-red-50 text-red-800 ring-red-200";
    case "REVERSED": return "bg-slate-100 text-slate-700 ring-slate-200";
    default: return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export type TxRow = {
  id: string;
  reference: string;
  transactionType: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "CURRENCY_CONVERSION" | "FEE" | "REVERSAL";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REVERSED";
  description: string;
  amount: Prisma.Decimal;
  currencyCode: string;
  createdAt: Date;
  completedAt: Date | null;
  ledgerEntries: Array<{ entryType: "DEBIT" | "CREDIT"; amount: Prisma.Decimal; currencyCode: string }>;
};

export function TransactionList({ transactions, compact = false }: { transactions: TxRow[]; compact?: boolean }) {
  if (transactions.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Description</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            {!compact ? <th className="py-2 pr-4 font-medium">Reference</th> : null}
            <th className="py-2 pr-4 font-medium">Direction</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {transactions.map((tx) => {
            const direction = deriveDirection(tx.ledgerEntries);
            return (
              <tr key={tx.id} className="border-t border-veltrix-silver align-top">
                <td className="py-3 pr-4 whitespace-nowrap text-slate-600">
                  <time dateTime={tx.createdAt.toISOString()}>{tx.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</time>
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-slate-900">{tx.description}</p>
                  {compact ? <p className="mt-0.5 text-xs text-slate-500">{tx.reference}</p> : null}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">{formatTxType(tx.transactionType)}</td>
                {!compact ? <td className="py-3 pr-4 font-mono text-xs text-slate-600">{tx.reference}</td> : null}
                <td className="py-3 pr-4 whitespace-nowrap">{directionLabel(direction)}</td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadgeClass(tx.status)}`}>
                    {formatTxStatus(tx.status)}
                  </span>
                </td>
                <td className="py-3 text-right font-semibold text-veltrix-navy whitespace-nowrap">
                  <MoneyAmount value={tx.amount.toString()} currencyCode={tx.currencyCode} />
                  <span className="ml-1 text-xs font-medium text-slate-500">{tx.currencyCode}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
