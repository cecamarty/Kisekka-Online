/**
 * Date & Time Formatting
 *
 * Relative time display for the feed ("2 min ago", "1 hr ago").
 */

import { Timestamp } from "firebase/firestore";

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;

/**
 * Format a Firestore timestamp as relative time.
 * e.g. "Just now", "5 min ago", "2 hrs ago", "3 days ago"
 */
export function timeAgo(timestamp: Timestamp | Date | number): string {
    let date: Date;

    if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 30) return "Just now";
    if (seconds < MINUTE) return `${seconds}s ago`;
    if (seconds < HOUR) {
        const mins = Math.floor(seconds / MINUTE);
        return `${mins} min${mins > 1 ? "s" : ""} ago`;
    }
    if (seconds < DAY) {
        const hrs = Math.floor(seconds / HOUR);
        return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    }
    if (seconds < WEEK) {
        const days = Math.floor(seconds / DAY);
        return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    // Beyond a week, show the date
    return date.toLocaleDateString("en-UG", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
}

/**
 * Format price in UGX (Ugandan Shillings).
 * e.g. 450000 → "UGX 450,000"
 */
export function formatPrice(amount: number): string {
    return `UGX ${amount.toLocaleString("en-UG")}`;
}

/**
 * Format phone number for display.
 * e.g. "256700123456" → "+256 700 123 456"
 */
export function formatPhoneNumber(phone: string): string {
    const clean = phone.replace(/\D/g, "");

    if (clean.startsWith("256") && clean.length === 12) {
        return `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
    }

    return phone;
}
