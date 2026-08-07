import { guidePages } from "./guides-data";
import { seoPages } from "../seo/seo-pages-data";

export type GuideDirectoryEntry = {
  path: `/${string}`;
  listTitle: string;
  description: string;
  label: string;
};

export type GuideCollection = {
  key: string;
  title: string;
  description: string;
  pages: readonly GuideDirectoryEntry[];
};

function entry(
  page: { path: `/${string}`; listTitle: string; description: string },
  label: string,
): GuideDirectoryEntry {
  return {
    path: page.path,
    listTitle: page.listTitle,
    description: page.description,
    label,
  };
}

export const guideCollections = [
  {
    key: "organize",
    title: "Organize and retrieve your files",
    description:
      "Build a reliable library for STL, 3MF, and OBJ files, then find the right model without digging through folders.",
    pages: [
      entry(seoPages.howToOrganizeStlFiles, "Start here"),
      entry(seoPages.organizeStlFiles, "STL organization"),
      entry(seoPages.stlFileOrganizer, "STL organization"),
      entry(seoPages.stlFileManagementSoftware, "Product guide"),
      entry(seoPages.threeDPrintFileOrganization, "Mixed formats"),
      entry(seoPages.bestWayToOrganizeStlFiles, "Practical guide"),
      entry(seoPages.howToManageLargeStlLibraries, "Large libraries"),
      entry(seoPages.stopStlFolderChaos, "Practical guide"),
      entry(seoPages.organize3mfFiles, "3MF files"),
      entry(seoPages.organizeObjFilesFor3dPrinting, "OBJ files"),
    ],
  },
  {
    key: "repeat-work",
    title: "Tags, versions, and repeat work",
    description:
      "Add structure, preserve revisions, and preview models before they return to the print queue.",
    pages: [
      entry(seoPages.taggingSystemFor3dModels, "Tagging"),
      entry(seoPages.taggingStlFilesForFastSearch, "Fast retrieval"),
      entry(seoPages.versionControlForStlFiles, "Version history"),
      entry(seoPages.stlVersionControlForMakers, "Repeat work"),
      entry(guidePages.modelPreviewInBrowser, "Browser preview"),
    ],
  },
  {
    key: "choose-library",
    title: "Choose the right library",
    description:
      "Understand when a private model library fits better than folders, cloud drives, or public marketplaces.",
    pages: [
      entry(seoPages.private3dModelLibrary, "Private library"),
      entry(seoPages.private3dModelLibrarySoftware, "Product guide"),
      entry(seoPages.stlShelfVsFolders, "Comparison"),
      entry(seoPages.stlShelfVsGoogleDriveForStlFiles, "Comparison"),
      entry(seoPages.stlShelfVsDropboxFor3dModelLibraries, "Comparison"),
      entry(seoPages.stlShelfVsMarketplacesForPrivateLibraries, "Comparison"),
    ],
  },
  {
    key: "hosting",
    title: "Hosting, privacy, and control",
    description:
      "Use the managed STL Shelf service for the simplest experience, or review the ownership tradeoffs when self-hosting is a firm requirement.",
    pages: [
      entry(seoPages.selfHosted3dModelLibrary, "Hosting choice"),
      entry(seoPages.selfHostedStlFileLibrary, "Hosting choice"),
      entry(seoPages.selfHosted3dModelLibrarySoftware, "Product guide"),
      entry(seoPages.openSource3dModelLibrarySoftware, "Open source"),
      entry(seoPages.openSourceStlLibrarySoftware, "Open source"),
      entry(seoPages.openSourceStlOrganizer, "Open source"),
      entry(seoPages.privateSelfHostedStlLibrary, "Privacy and control"),
    ],
  },
] as const satisfies readonly GuideCollection[];

export const guideDirectoryPages = guideCollections.flatMap((collection) => collection.pages);
