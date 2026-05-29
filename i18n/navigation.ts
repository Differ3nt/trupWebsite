import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware navigation APIs — import Link/redirect/usePathname/useRouter
// from here instead of next/navigation so locale prefixing is automatic.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
