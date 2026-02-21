/**
 * Firestore Collection References
 *
 * Centralized collection references with proper typing.
 */

import {
    collection,
    doc,
    CollectionReference,
    DocumentReference,
} from "firebase/firestore";
import { db } from "./config";
import type {
    User,
    Shop,
    FeedPost,
    MarketplaceListing,
    PostResponse,
    Notification,
    ActivitySignal,
    Report,
} from "@kisekka/types";

// ─── Typed Collection Helpers ────────────────────────────────────────

function typedCollection<T>(path: string) {
    return collection(db, path) as CollectionReference<T>;
}

function typedDoc<T>(collectionPath: string, docId: string) {
    return doc(db, collectionPath, docId) as DocumentReference<T>;
}

// ─── Collections ─────────────────────────────────────────────────────

export const collections = {
    users: () => typedCollection<User>("users"),
    shops: () => typedCollection<Shop>("shops"),
    feedPosts: () => typedCollection<FeedPost>("feedPosts"),
    marketplaceListings: () =>
        typedCollection<MarketplaceListing>("marketplaceListings"),
    responses: () => typedCollection<PostResponse>("responses"),
    notifications: () => typedCollection<Notification>("notifications"),
    activitySignals: () => typedCollection<ActivitySignal>("activitySignals"),
    reports: () => typedCollection<Report>("reports"),
};

// ─── Document References ─────────────────────────────────────────────

export const docs = {
    user: (id: string) => typedDoc<User>("users", id),
    shop: (id: string) => typedDoc<Shop>("shops", id),
    feedPost: (id: string) => typedDoc<FeedPost>("feedPosts", id),
    marketplaceListing: (id: string) =>
        typedDoc<MarketplaceListing>("marketplaceListings", id),
    response: (id: string) => typedDoc<PostResponse>("responses", id),
    notification: (id: string) => typedDoc<Notification>("notifications", id),
    activitySignal: (id: string) =>
        typedDoc<ActivitySignal>("activitySignals", id),
    report: (id: string) => typedDoc<Report>("reports", id),
};
