// Official Prayer & Fire App Configuration
// All domain references should use these constants for consistency

export const APP_CONFIG = {
  // Primary domain - all URLs should point here
  DOMAIN: "prayerandfire.org",
  URL: "https://prayerandfire.org",
  
  // Contact & Support
  SUPPORT_EMAIL: "prayerandfireglobal@gmail.com",
  
  // App Info
  APP_NAME: "Prayer & Fire",
  APP_DESCRIPTION: "A faith-based mobile application for prayer, community, and spiritual growth.",
  
  // Social/Share
  SHARE_TEXT: "🔥 Download the Prayer & Fire App — a faith-based app for prayer, community, and spiritual growth!",

  // App Store / Play Store download links.
  // Set these to the real store URLs when the listings are live. The Share
  // Prayer & Fire button uses these — never the marketing website.
  APP_STORE_URL: "https://apps.apple.com/us/app/prayerandfire-mobile/id6757282653",
  PLAY_STORE_URL: "",
  
  
  // External Links
  BOOK_AMAZON_LINK: "https://a.co/d/dfgHEvM",
} as const;

// Note: If prayerandfireapp.com is added later, 
// configure it as a redirect to prayerandfire.org in DNS settings
