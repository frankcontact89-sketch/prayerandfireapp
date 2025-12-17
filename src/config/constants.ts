// Official Prayer & Fire App Configuration
// All domain references should use these constants for consistency

export const APP_CONFIG = {
  // Primary domain - all URLs should point here
  DOMAIN: "prayerandfire.app",
  URL: "https://prayerandfire.app",
  
  // Contact & Support
  SUPPORT_EMAIL: "frankcontact89@gmail.com",
  
  // App Info
  APP_NAME: "Prayer & Fire",
  APP_DESCRIPTION: "A faith-based mobile application for prayer, community, and spiritual growth.",
  
  // Social/Share
  SHARE_TEXT: "🔥 Check out the Prayer & Fire App - A faith-based app for prayer, community, and spiritual growth!",
  
  // Stripe URLs
  STRIPE_SUBSCRIPTION: "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00",
  STRIPE_ONETIME: "https://buy.stripe.com/28E5kDbjWe2S4mz1rt7bW04",
  
  // External Links
  BOOK_AMAZON_LINK: "https://a.co/d/dfgHEvM",
} as const;

// Note: If prayerandfireapp.com is added later, 
// configure it as a redirect to prayerandfire.app in DNS settings
