export { app, auth, db, storage, firebaseConfig } from "./config";
export { collections, docs } from "./collections";
export {
    setupRecaptcha,
    sendOTP,
    verifyOTP,
    signOut,
    onAuthChange,
} from "./auth";
export {
    createUser,
    getUser,
    updateUser,
    createShop,
    getShop,
    getShopsByZone,
    getShopsByCategory,
    createFeedPost,
    getFeedPost,
    getFeedPosts,
    getFeedPostsByCategory,
    toggleInterested,
    createMarketplaceListing,
    getMarketplaceListing,
    getMarketplaceListings,
    createResponse,
    getResponsesForPost,
    trackWhatsAppTap,
    createNotification,
    getNotifications,
    markNotificationRead,
    getUnreadNotificationCount,
    createReport,
    logActivity,
} from "./firestore-service";
export {
    uploadImage,
    deleteImage,
    generateImagePath,
} from "./storage";
