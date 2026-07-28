type SocialLinkContext = {
  title: string;
  url: string;
  imageUrl: string;
};

type SocialLink = {
  label: string;
  href: string;
};

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/";

/**
 * Social destinations shown on artwork pages.
 * Add, remove, or reorder entries here to manage the buttons site-wide.
 */
export function getSocialLinks({
  title,
  url,
  imageUrl,
}: SocialLinkContext): SocialLink[] {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedImageUrl = encodeURIComponent(imageUrl);

  return [
    {
      label: "Instagram",
      href: INSTAGRAM_PROFILE_URL,
    },
    {
      label: "Pinterest",
      href: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImageUrl}&description=${encodedTitle}`,
    },
  ];
}
