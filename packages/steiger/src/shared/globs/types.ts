export interface GlobGroup {
  files: string[]
  ignores: string[]
}

export interface InvertedGlobGroup extends GlobGroup {
  inverted: boolean
}
