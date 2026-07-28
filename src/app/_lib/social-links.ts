type SocialLink = {
  label: string;
  href: string;
};

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/___gianluca.b";

/**
 * Social destinations shown on artwork pages.
 * Add, remove, or reorder entries here to manage the buttons site-wide.
 */
export function getSocialLinks(): SocialLink[] {

  return [
    {
      label: "Instagram",
      href: INSTAGRAM_PROFILE_URL,
    },
  ];
}
