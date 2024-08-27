export type SiteConfig = typeof siteConfig;

export const apiUrl = import.meta.env.VITE_API_URL;

export const siteConfig = {
  name: "File Uploader",
  description: "Upload big files fast and easy",
  navItems: [
    {
      label: "Subir",
      href: "/",
    },
    {
      label: "Archivos",
      href: "/files",
    }
  ],
  navMenuItems: [
    {
      label: "Subir",
      href: "/",
    },
    {
      label: "Archivos",
      href: "/files",
    }
  ],
  links: {
    github: "https://github.com/omaar/"
  },
};
