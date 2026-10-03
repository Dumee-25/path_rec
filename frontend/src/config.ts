/**
 * The official NSBM Green University logo, shown in the header.
 *
 * `public/logo/nsbm-green-university.png` is the supplied file with its empty transparent
 * margins trimmed; the artwork itself is unchanged (the untouched original is kept in
 * `design-system/assets/Logos/`). Set this to `null` to fall back to plain type.
 */
export const LOGO_SRC: string | null = "/logo/nsbm-green-university.png";
export const LOGO_WIDTH = 1080;
export const LOGO_HEIGHT = 486;

export const QUESTION_COUNT_COPY = "5 questions";

/**
 * The photograph beside the landing-page headline, a real NSBM Media photo (not stock).
 * `public/images/computing-lab.jpg` is a 4:3 crop of `assets/photos/nsbm-computing-lab-original.jpg`
 * that leaves out the credit banner, so the credit is set as text below the photo instead.
 * Set to `null` to show the landing page without a photo.
 */
export const LANDING_PHOTO: {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** The photographer line from the original banner. */
  photographer: string;
  /** The rights line from the original banner. */
  rights: string;
} | null = {
  src: "/images/computing-lab.jpg",
  width: 832,
  height: 624,
  alt: "Students working together on laptops at a shared table in a busy computing lab",
  photographer: "Photography by Charitha Dissanayaka",
  rights: "© NSBM Media 2026. All rights reserved.",
};

/**
 * Footer details, as published on nsbm.ac.lk and its Faculty of Computing page. Edit them here.
 * The enquiry email and phone are the ones the faculty lists for new student enrolments.
 */
export const FOOTER = {
  faculty: "Faculty of Computing",
  institution: "NSBM Green University",
  address: "Mahenwaththa, Pitipana, Homagama, Sri Lanka",
  enquiries: {
    label: "New student enquiries",
    email: "inquiries@nsbm.ac.lk",
    phone: "+94 11 544 5000",
  },
  website: {
    label: "Faculty website",
    text: "nsbm.ac.lk/faculty-of-computing",
    href: "https://www.nsbm.ac.lk/faculty-of-computing/",
  },
  rightsHolder: "NSBM Green University",
};
