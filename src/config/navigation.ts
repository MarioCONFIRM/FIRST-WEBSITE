import type { NavigationItem } from "@/types";

export const publicNavigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Personal Banking", href: "/personal-banking" },
  { label: "Business Banking", href: "/business-banking" },
  {
    label: "Services",
    href: "/services",
    children: [
      {
        label: "All Services",
        href: "/services",
        description: "Overview of available and planned banking services.",
      },
      {
        label: "Personal Banking",
        href: "/personal-banking",
        description: "Everyday account and digital banking information.",
      },
      {
        label: "Business Banking",
        href: "/business-banking",
        description: "Account and financial management for businesses.",
      },
      {
        label: "Security",
        href: "/security",
        description: "Protection principles and security awareness.",
      },
    ],
  },
  { label: "About Us", href: "/about" },
  { label: "Security", href: "/security" },
  { label: "Contact", href: "/contact" },
];

export const footerQuickLinks = [
  { label: "Home", href: "/" },
  { label: "Personal Banking", href: "/personal-banking" },
  { label: "Business Banking", href: "/business-banking" },
  { label: "Services", href: "/services" },
  { label: "About Us", href: "/about" },
  { label: "Security", href: "/security" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
];

export const customerDashboardNavigation = [
  { label: "Overview", href: "/dashboard" },
  { label: "My Accounts", href: "/dashboard/accounts" },
  { label: "Transactions", href: "/dashboard/transactions" },
  { label: "Profile", href: "/dashboard/profile" },
  { label: "Security", href: "/dashboard/security" },
] as const;

export const customerNavigation: NavigationItem[] = customerDashboardNavigation.map(
  (item) => ({ label: item.label, href: item.href }),
);

export const adminNavigation: NavigationItem[] = [
  { label: "Admin Dashboard", href: "/admin" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Accounts", href: "/admin/accounts" },
  { label: "Transactions", href: "/admin/transactions" },
];
