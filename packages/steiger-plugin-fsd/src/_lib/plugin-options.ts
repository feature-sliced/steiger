/** Options that apply to every rule of the FSD plugin, passed to `createFsdPlugin`. */
export interface FSDPluginOptions {
  /** Segment names, besides the conventional ones, that make a folder count as a slice. */
  additionalSegments?: Array<string>
}
