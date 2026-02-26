/**
 * Firestore Service
 *
 * CRUD operations for all collections.
 * This is the single data access layer for the entire app.
 */

import {
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    increment,
    DocumentSnapshot,
    QueryConstraint,
} from "firebase/firestore";
import { collections, docs } from "./collections";
import type {
    User,
    Shop,
    FeedPost,
    MarketplaceListing,
    PostResponse,
    Notification,
    CreateUserInput,
    CreateShopInput,
    CreateFeedPostInput,
    CreateMarketplaceListingInput,
    CreateResponseInput,
    CreateReportInput,
    LocationZone,
    PartCategory,
} from "@kisekka/types";

const DEFAULT_MARKET_ID = "kisekka";
const DEFAULT_PAGE_SIZE = 20;

// ─── Users ───────────────────────────────────────────────────────────

export async function createUser(
    userId: string,
    data: CreateUserInput
): Promise<void> {
    const { setDoc } = await import("firebase/firestore");
    await setDoc(docs.user(userId), {
        ...data,
        id: userId,
        marketId: data.marketId || DEFAULT_MARKET_ID,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
    } as User);
}

export async function getUser(userId: string): Promise<User | null> {
    const snap = await getDoc(docs.user(userId));
    return snap.exists() ? (snap.data() as User) : null;
}

export async function updateUser(
    userId: string,
    data: Partial<User>
): Promise<void> {
    await updateDoc(docs.user(userId), {
        ...data,
        lastActiveAt: serverTimestamp(),
    });
}

// ─── Shops ───────────────────────────────────────────────────────────

export async function createShop(data: CreateShopInput): Promise<string> {
    const docRef = await addDoc(collections.shops(), {
        ...data,
        marketId: data.marketId || DEFAULT_MARKET_ID,
        verified: false,
        lastActivityAt: serverTimestamp(),
        createdAt: serverTimestamp(),
    });
    // Update the doc with its own ID
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
}

export async function getShop(shopId: string): Promise<Shop | null> {
    const snap = await getDoc(docs.shop(shopId));
    return snap.exists() ? (snap.data() as Shop) : null;
}

export async function getShopsByZone(zone: LocationZone): Promise<Shop[]> {
    const q = query(
        collections.shops(),
        where("marketId", "==", DEFAULT_MARKET_ID),
        where("zone", "==", zone)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Shop);
}

export async function getAllShops(pageSize: number = 50): Promise<Shop[]> {
    const q = query(
        collections.shops(),
        where("marketId", "==", DEFAULT_MARKET_ID),
        limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Shop);
}

export async function getShopsByCategory(
    category: PartCategory
): Promise<Shop[]> {
    const q = query(
        collections.shops(),
        where("marketId", "==", DEFAULT_MARKET_ID),
        where("categories", "array-contains", category)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Shop);
}

// ─── Feed Posts ───────────────────────────────────────────────────────

export async function createFeedPost(
    data: CreateFeedPostInput
): Promise<string> {
    const docRef = await addDoc(collections.feedPosts(), {
        ...data,
        marketId: data.marketId || DEFAULT_MARKET_ID,
        responseCount: 0,
        interestedCount: 0,
        status: "active",
        lastActivityAt: serverTimestamp(),
        createdAt: serverTimestamp(),
    });
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
}

export async function getFeedPost(postId: string): Promise<FeedPost | null> {
    const snap = await getDoc(docs.feedPost(postId));
    return snap.exists() ? (snap.data() as FeedPost) : null;
}

export async function getFeedPosts(
    pageSize: number = DEFAULT_PAGE_SIZE,
    lastDoc?: DocumentSnapshot
): Promise<{ posts: FeedPost[]; lastDoc: DocumentSnapshot | null }> {
    const constraints: QueryConstraint[] = [
        where("marketId", "==", DEFAULT_MARKET_ID),
        where("status", "==", "active"),
        orderBy("urgent", "desc"),
        orderBy("lastActivityAt", "desc"),
        limit(pageSize),
    ];

    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }

    const q = query(collections.feedPosts(), ...constraints);
    const snap = await getDocs(q);
    const posts = snap.docs.map((d) => d.data() as FeedPost);
    const lastVisible = snap.docs[snap.docs.length - 1] || null;
    return { posts, lastDoc: lastVisible };
}

export async function getFeedPostsByCategory(
    category: PartCategory,
    pageSize: number = DEFAULT_PAGE_SIZE
): Promise<FeedPost[]> {
    const q = query(
        collections.feedPosts(),
        where("marketId", "==", DEFAULT_MARKET_ID),
        where("category", "==", category),
        where("status", "==", "active"),
        orderBy("lastActivityAt", "desc"),
        limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FeedPost);
}

export async function getUserFeedPosts(userId: string): Promise<FeedPost[]> {
    const q = query(
        collections.feedPosts(),
        where("authorId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FeedPost);
}

export async function updateFeedPost(postId: string, data: Partial<FeedPost>): Promise<void> {
    await updateDoc(docs.feedPost(postId), {
        ...data,
        lastActivityAt: serverTimestamp(),
    });
}

export async function deleteFeedPost(postId: string): Promise<void> {
    await deleteDoc(docs.feedPost(postId));
}

export async function toggleInterested(postId: string): Promise<void> {
    await updateDoc(docs.feedPost(postId), {
        interestedCount: increment(1),
        lastActivityAt: serverTimestamp(),
    });
}

// ─── Marketplace Listings ────────────────────────────────────────────

export async function createMarketplaceListing(
    data: CreateMarketplaceListingInput
): Promise<string> {
    const docRef = await addDoc(collections.marketplaceListings(), {
        ...data,
        marketId: data.marketId || DEFAULT_MARKET_ID,
        engagementCount: 0,
        status: "active",
        lastActivityAt: serverTimestamp(),
        createdAt: serverTimestamp(),
    });
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
}

export async function getMarketplaceListing(
    listingId: string
): Promise<MarketplaceListing | null> {
    const snap = await getDoc(docs.marketplaceListing(listingId));
    return snap.exists() ? (snap.data() as MarketplaceListing) : null;
}

export async function getMarketplaceListings(
    filters?: {
        category?: PartCategory;
        condition?: string;
        zone?: LocationZone;
    },
    pageSize: number = DEFAULT_PAGE_SIZE,
    lastDoc?: DocumentSnapshot
): Promise<MarketplaceListing[]> {
    const constraints: QueryConstraint[] = [
        where("marketId", "==", DEFAULT_MARKET_ID),
        where("status", "==", "active"),
    ];

    if (filters?.category) {
        constraints.push(where("category", "==", filters.category));
    }
    if (filters?.condition) {
        constraints.push(where("condition", "==", filters.condition));
    }
    if (filters?.zone) {
        constraints.push(where("locationZone", "==", filters.zone));
    }

    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(pageSize));

    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }

    const q = query(collections.marketplaceListings(), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as MarketplaceListing);
}

// ─── Responses ───────────────────────────────────────────────────────

export async function createResponse(
    data: CreateResponseInput
): Promise<string> {
    const docRef = await addDoc(collections.responses(), {
        ...data,
        whatsappTaps: 0,
        createdAt: serverTimestamp(),
    });
    await updateDoc(docRef, { id: docRef.id });

    // Increment response count on the parent post
    if (data.postType === "feed") {
        await updateDoc(docs.feedPost(data.postId), {
            responseCount: increment(1),
            lastActivityAt: serverTimestamp(),
        });
    }

    return docRef.id;
}

export async function getResponsesForPost(
    postId: string
): Promise<PostResponse[]> {
    const q = query(
        collections.responses(),
        where("postId", "==", postId),
        orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PostResponse);
}

export async function trackWhatsAppTap(responseId: string): Promise<void> {
    await updateDoc(docs.response(responseId), {
        whatsappTaps: increment(1),
    });
}

// ─── Notifications ───────────────────────────────────────────────────

export async function createNotification(data: {
    userId: string;
    type: Notification["type"];
    title: string;
    body: string;
    referenceId: string;
    referenceType: string;
}): Promise<void> {
    await addDoc(collections.notifications(), {
        ...data,
        read: false,
        createdAt: serverTimestamp(),
    });
}

export async function getNotifications(
    userId: string,
    pageSize: number = DEFAULT_PAGE_SIZE
): Promise<Notification[]> {
    const q = query(
        collections.notifications(),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Notification));
}

export async function markNotificationRead(
    notificationId: string
): Promise<void> {
    await updateDoc(docs.notification(notificationId), { read: true });
}

export async function getUnreadNotificationCount(
    userId: string
): Promise<number> {
    const q = query(
        collections.notifications(),
        where("userId", "==", userId),
        where("read", "==", false)
    );
    const snap = await getDocs(q);
    return snap.size;
}

// ─── Reports ─────────────────────────────────────────────────────────

export async function createReport(data: CreateReportInput): Promise<void> {
    await addDoc(collections.reports(), {
        ...data,
        status: "pending",
        createdAt: serverTimestamp(),
    });
}

// ─── Activity Signals ────────────────────────────────────────────────

export async function logActivity(data: {
    type: "whatsapp_tap" | "post_view" | "response_click";
    referenceId: string;
    userId?: string;
    metadata?: Record<string, unknown>;
}): Promise<void> {
    await addDoc(collections.activitySignals(), {
        ...data,
        metadata: data.metadata || {},
        createdAt: serverTimestamp(),
    });
}
