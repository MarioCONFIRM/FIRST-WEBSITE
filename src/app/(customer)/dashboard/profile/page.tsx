import type { Metadata } from "next";
import Link from "next/link";

import { ProfileForm } from "@/components/ui/profile-form";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Profile" };
export const instant = false;

export default async function DashboardProfilePage() {
  const session = await requireCustomer();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      country: true,
      residentialAddress: true,
      emailVerified: true,
      emailVerifiedAt: true,
      role: true,
      accountStatus: true,
      accounts: {
        select: {
          accountNumber: true,
          accountType: true,
          currencyCode: true,
          status: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-veltrix-blue">Profile</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-veltrix-navy sm:text-3xl">Your profile</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          View your account details and update permitted personal information. Sensitive and system-controlled fields cannot be changed here.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
        <section className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-veltrix-navy">Personal information</h2>
          <p className="mt-1 text-sm text-slate-600">Only permitted fields can be updated.</p>
          <div className="mt-6">
            <ProfileForm
              defaults={{
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber ?? "",
                country: user.country,
                residentialAddress: user.residentialAddress ?? "",
              }}
            />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-veltrix-navy">Account &amp; verification status</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900 break-all">{user.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email verification</dt>
                <dd className="font-medium text-slate-900">
                  {user.emailVerified
                    ? `Verified${user.emailVerifiedAt ? ` on ${user.emailVerifiedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}` : ""}`
                    : "Pending verification"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Customer status</dt>
                <dd className="font-medium text-slate-900">{user.accountStatus}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Role</dt>
                <dd className="font-medium text-slate-900">{user.role}</dd>
              </div>
            </dl>
            {!user.emailVerified ? (
              <p className="mt-4 text-sm text-slate-700">
                Need to verify your email?{" "}
                <Link href="/verify-email" className="font-semibold text-veltrix-blue underline">Verify email</Link>
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-veltrix-silver bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-veltrix-navy">Your bank account(s)</h2>
            {user.accounts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No account records found.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {user.accounts.map((a) => (
                  <li key={a.accountNumber} className="rounded-xl border border-veltrix-silver p-4 text-sm">
                    <p><span className="text-slate-500">Account number:</span> <span className="font-semibold text-veltrix-navy">{a.accountNumber}</span></p>
                    <p className="mt-1"><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-900">{a.accountType}</span></p>
                    <p className="mt-1"><span className="text-slate-500">Currency:</span> <span className="font-medium text-slate-900">{a.currencyCode}</span></p>
                    <p className="mt-1"><span className="text-slate-500">Status:</span> <span className="font-medium text-slate-900">{a.status}</span></p>
                    <Link href={`/dashboard/accounts/${encodeURIComponent(a.accountNumber)}`} className="mt-2 inline-block text-xs font-semibold text-veltrix-blue hover:underline">View account details</Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs leading-5 text-slate-500">Account numbers, balances, statuses, roles, and verification states are system-controlled and cannot be changed by customers.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
