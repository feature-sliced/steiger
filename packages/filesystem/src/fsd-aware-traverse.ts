import { basename, join } from "node:path";

import { conventionalSegmentNames, layerSequence, unslicedLayers, type File, type Folder, type LayerName } from "./definitions.js";

/**
 * Extract layers from an FSD root.
 *
 * @returns A mapping of layer name to folder object.
 */
export function getLayers(fsdRoot: Folder): Partial<Record<LayerName, Folder>> {
  return Object.fromEntries(
    fsdRoot.children
      .filter(
        (child) =>
          child.type === "folder" && layerSequence.includes(basename(child.path)),
      )
      .map((child) => [basename(child.path) as LayerName, child]),
  );
}

/**
 * Extract slices from a **sliced** layer.
 *
 * A folder is detected as a slice when it has at least one folder/file with a name of a conventional segment (`ui`, `api`, `model`, `lib`, `config`).
 * If your project contains slices that don't have those segments, you can provide additional segment names.
 *
 * @returns A mapping of slice name (potentially containing slashes) to folder object.
 */
export function getSlices(
  slicedLayer: Folder,
  additionalSegmentNames: Array<string> = [],
): Record<string, Folder> {
  const slices: Record<string, Folder> = {};

  function traverse(folder: Folder, pathPrefix = "") {
    if (isSlice(folder, additionalSegmentNames)) {
      slices[join(pathPrefix, basename(folder.path))] = folder;
    } else {
      folder.children.forEach((child) => {
        if (child.type === "folder") {
          traverse(child, join(pathPrefix, basename(folder.path)));
        }
      });
    }
  }

  for (const child of slicedLayer.children) {
    if (child.type === "folder") {
      traverse(child);
    }
  }

  return slices;
}

/**
 * Extract segments from a slice or an **unsliced** layer.
 *
 * @returns A mapping of segment name to folder or file object.
 */
export function getSegments(
  sliceOrUnslicedLayer: Folder,
): Record<string, Folder | File> {
  return Object.fromEntries(
    sliceOrUnslicedLayer.children
      .filter(
        (child) =>
          child.type !== "file" ||
          withoutExtension(basename(child.path)) !== "index",
      )
      .map((child) => [withoutExtension(basename(child.path)), child]),
  );
}

/**
 * Extract slices from all layers of an FSD root.
 *
 * A folder is detected as a slice when it has at least one folder/file with a name of a conventional segment (`ui`, `api`, `model`, `lib`, `config`).
 * If your project contains slices that don't have those segments, you can provide additional segment names.
 *
 * @returns A mapping of slice name (potentially containing slashes) to folder object with added layer name.
 */
export function getAllSlices(
  fsdRoot: Folder,
  additionalSegmentNames: Array<string> = [],
): Record<string, Folder & { layerName: string }> {
  return Object.values(getLayers(fsdRoot))
    .filter(isSliced)
    .reduce((slices, layer) => {
      return {
        ...slices,
        ...Object.fromEntries(
          Object.entries(getSlices(layer, additionalSegmentNames)).map(
            ([name, slice]) => [
              name,
              { ...slice, layerName: basename(layer.path) },
            ],
          ),
        ),
      };
    }, {});
}

/**
 * Extract segments from all slices and layers of an FSD root.
 *
 * @returns A flat array of segments along with their name and location in the FSD root (layer, slice).
 */
export function getAllSegments(fsdRoot: Folder): Array<{
  segment: Folder | File;
  segmentName: string;
  sliceName: string | null;
  layerName: LayerName;
}> {
  return Object.entries(getLayers(fsdRoot)).flatMap(([layerName, layer]) => {
    if (isSliced(layer)) {
      return Object.entries(getSlices(layer)).flatMap(([sliceName, slice]) =>
        Object.entries(getSegments(slice)).map(([segmentName, segment]) => ({
          segment,
          segmentName,
          sliceName: sliceName as string | null,
          layerName: layerName as LayerName,
        })),
      );
    } else {
      return Object.entries(getSegments(layer)).map(
        ([segmentName, segment]) => ({
          segment,
          segmentName,
          sliceName: null as string | null,
          layerName: layerName as LayerName,
        }),
      );
    }
  });
}

/**
 * Determine if this layer is sliced.
 *
 * Only layers Shared and App are not sliced, the rest are.
 */
export function isSliced(layerOrName: Folder | LayerName): boolean {
  return !unslicedLayers.includes(
    basename(typeof layerOrName === "string" ? layerOrName : layerOrName.path),
  );
}

/**
 * Get the index (public API) of a slice or segment.
 *
 * When a segment is a file, it is its own index.
 */
export function getIndex(fileOrFolder: File | Folder): File | undefined {
  if (fileOrFolder.type === "file") {
    return fileOrFolder;
  } else {
    return fileOrFolder.children.find(
      (child) =>
        child.type === "file" &&
        withoutExtension(basename(child.path)) === "index",
    ) as File | undefined;
  }
}

/**
 * Determine if this folder is a slice.
 *
 * Slices are defined as folders that contain at least one segment.
 * Additional segment names can be provided if some slice in project contains only unconventional segments.
 */
export function isSlice(
  folder: Folder,
  additionalSegmentNames: Array<string> = [],
): boolean {
  return folder.children.some((child) =>
    conventionalSegmentNames
      .concat(additionalSegmentNames)
      .includes(withoutExtension(basename(child.path))),
  );
}

/**
 * Cut away one layer of extension from a filename.
 *
 * @example
 * withoutExtension("index.tsx") // "index"
 * withoutExtension("index.spec.tsx") // "index.spec"
 * withoutExtension("index") // "index"
 */
function withoutExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf(".");
  return lastDotIndex === -1 ? filename : filename.slice(0, lastDotIndex);
}
