/**
 * Kisekka Online — Core Type Definitions
 *
 * All Firestore document interfaces and shared enums.
 * These are the source of truth for the entire app.
 */

import { Timestamp } from "firebase/firestore";

// ─── Enums & Constants ───────────────────────────────────────────────

export type UserRole = "shop_owner" | "mechanic" | "buyer";

export type PostType = "request" | "social_sale";

export type PostStatus = "active" | "resolved" | "expired";

export type ListingCondition = "new" | "used" | "refurbished";

export type ListingStatus = "active" | "sold" | "expired";

export type NotificationType = "response" | "mention" | "category_match";

export type ActivitySignalType =
    | "whatsapp_tap"
    | "post_view"
    | "response_click";

export type ReportReason =
    | "spam"
    | "inappropriate"
    | "fake"
    | "scam"
    | "other";

export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

/** Kisekka Market zones */
export const LOCATION_ZONES = [
    "KM1",
    "KM2",
    "KM3",
    "KM4",
    "KM5",
    "Other",
] as const;

export type LocationZone = (typeof LOCATION_ZONES)[number];

/** Part categories */
export const PART_CATEGORIES = [
    "Engine Parts",
    "Body Parts",
    "Electronics",
    "Suspension",
    "Brakes",
    "Transmission",
    "Interior",
    "Exterior",
    "Lights",
    "Tyres & Wheels",
    "Accessories",
    "Other",
] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number];

// ─── Firestore Document Interfaces ───────────────────────────────────

/** users/{userId} */
export interface User {
    id: string;
    displayName: string;
    phoneNumber: string;
    whatsappNumber: string;
    role: UserRole;
    avatarUrl: string;
    locationZone: LocationZone;
    shopId?: string;
    marketId: string;
    createdAt: Timestamp;
    lastActiveAt: Timestamp;
}

/** shops/{shopId} */
export interface Shop {
    id: string;
    ownerId: string;
    name: string;
    zone: LocationZone;
    categories: PartCategory[];
    whatsappNumber: string;
    phoneNumber: string;
    description: string;
    avatarUrl: string;
    marketId: string;
    verified: boolean;
    lastActivityAt: Timestamp;
    createdAt: Timestamp;
}

/** feedPosts/{postId} */
export interface FeedPost {
    id: string;
    type: PostType;
    authorId: string;
    partName: string;
    carModel: string;
    year?: string;
    description: string;
    images: string[];
    urgent: boolean;
    locationZone: LocationZone;
    marketId: string;
    category?: PartCategory;
    responseCount: number;
    interestedCount: number;
    lastActivityAt: Timestamp;
    createdAt: Timestamp;
    status: PostStatus;
}

/** marketplaceListings/{listingId} */
export interface MarketplaceListing {
    id: string;
    sellerId: string;
    shopId?: string;
    title: string;
    price: number;
    currency: "UGX";
    condition: ListingCondition;
    category: PartCategory;
    carModel?: string;
    description: string;
    images: string[];
    locationZone: LocationZone;
    marketId: string;
    lastActivityAt: Timestamp;
    engagementCount: number;
    createdAt: Timestamp;
    status: ListingStatus;
}

/** responses/{responseId} */
export interface PostResponse {
    id: string;
    postId: string;
    postType: "feed" | "marketplace";
    responderId: string;
    shopId?: string;
    message: string;
    price?: number;
    images?: string[];
    createdAt: Timestamp;
    whatsappTaps: number;
}

/** notifications/{notificationId} */
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    referenceId: string;
    referenceType: string;
    read: boolean;
    createdAt: Timestamp;
}

/** activitySignals/{docId} */
export interface ActivitySignal {
    id: string;
    type: ActivitySignalType;
    referenceId: string;
    userId?: string;
    createdAt: Timestamp;
    metadata: Record<string, unknown>;
}

/** reports/{reportId} */
export interface Report {
    id: string;
    reporterId: string;
    targetId: string;
    targetType: "post" | "response" | "user" | "shop";
    reason: ReportReason;
    description?: string;
    status: ReportStatus;
    createdAt: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string;
}

// ─── Form / Input Types (no Timestamp, no id) ───────────────────────

export type CreateUserInput = Omit<User, "id" | "createdAt" | "lastActiveAt">;

export type CreateShopInput = Omit<
    Shop,
    "id" | "createdAt" | "lastActivityAt" | "verified"
>;

export type CreateFeedPostInput = Omit<
    FeedPost,
    | "id"
    | "createdAt"
    | "lastActivityAt"
    | "responseCount"
    | "interestedCount"
    | "status"
>;

export type CreateMarketplaceListingInput = Omit<
    MarketplaceListing,
    | "id"
    | "createdAt"
    | "lastActivityAt"
    | "engagementCount"
    | "status"
>;

export type CreateResponseInput = Omit<
    PostResponse,
    "id" | "createdAt" | "whatsappTaps"
>;

export type CreateReportInput = Omit<
    Report,
    "id" | "createdAt" | "status" | "reviewedAt" | "reviewedBy"
>;
