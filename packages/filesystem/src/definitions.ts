export interface File {
  type: "file";
  path: string;
}

export interface Folder {
  type: "folder";
  path: string;
  children: Array<File | Folder>;
}

/**
 * An FSD root is an isolated folder structure that adheres to the rules of FSD.
 *
 * There can be several FSD roots in a project, they can also be arbitrarily nested.
 */
export type FsdRoot = Folder;

export type LayerName =
  | "shared"
  | "entities"
  | "features"
  | "widgets"
  | "pages"
  | "app";

export const layerSequence: Array<LayerName> = [
  "shared",
  "entities",
  "features",
  "widgets",
  "pages",
  "app",
];
export const unslicedLayers = ["shared", "app"];
export const conventionalSegmentNames = ["ui", "api", "lib", "model", "config"];
