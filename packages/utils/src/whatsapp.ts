/**
 * WhatsApp Deep Link Utilities
 *
 * Generates WhatsApp deep links for buyer-seller contact.
 * This is THE conversion mechanism for Kisekka Online.
 */

/**
 * Build a WhatsApp deep link URL.
 * @param phoneNumber - Full international phone number (e.g. "256700123456")
 * @param message - Optional pre-filled message
 */
export function buildWhatsAppLink(
    phoneNumber: string,
    message?: string
): string {
    // Clean the phone number: remove spaces, dashes, plus signs
    const cleanNumber = phoneNumber.replace(/[\s\-+()]/g, "");

    // Ensure it starts with country code (assume Uganda 256 if not)
    const fullNumber = cleanNumber.startsWith("0")
        ? `256${cleanNumber.slice(1)}`
        : cleanNumber.startsWith("256")
            ? cleanNumber
            : `256${cleanNumber}`;

    const base = `https://wa.me/${fullNumber}`;

    if (message) {
        return `${base}?text=${encodeURIComponent(message)}`;
    }

    return base;
}

/**
 * Build a contextual WhatsApp message for a response.
 */
export function buildResponseWhatsAppMessage(params: {
    partName: string;
    carModel?: string;
    responderName?: string;
}): string {
    const { partName, carModel, responderName } = params;
    let message = `Hi`;

    if (responderName) {
        message += ` ${responderName}`;
    }

    message += `, I saw your response on Kisekka Online about *${partName}*`;

    if (carModel) {
        message += ` for ${carModel}`;
    }

    message += `. Is it still available?`;

    return message;
}

/**
 * Build a WhatsApp message for contacting a shop directly.
 */
export function buildShopContactMessage(shopName: string): string {
    return `Hi, I found your shop *${shopName}* on Kisekka Online. I'm looking for a part.`;
}
