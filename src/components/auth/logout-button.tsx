import { logoutAction } from "@/server/auth/actions";

export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ||
          "inline-flex items-center justify-center rounded-full border border-veltrix-silver bg-white px-4 py-2 text-sm font-semibold text-veltrix-navy transition hover:border-veltrix-blue hover:text-veltrix-blue"
        }
      >
        Sign out
      </button>
    </form>
  );
}
