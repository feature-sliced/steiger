import { Diagnostic } from '@steiger/types'

const DEFAULT_QUOTA = 20

function distributeQuota(buckets: Array<number>, quota: number) {
  // const allItems = buckets.reduce((acc, bucket) => acc + bucket, 0)
  const quotaPerBucket = buckets.slice(0).fill(0)
  let remainingQuota = quota

  // Temporary algorithm to distribute the quota
  for (let i = 0; remainingQuota > 0; i++) {
    const bucket = buckets[i]

    // If it went beyond the last bucket, start from the first one
    if (bucket === undefined) {
      i = -1
      continue
    }

    // If the bucket does not contain any items, skip it
    if (bucket !== 0) {
      quotaPerBucket[i]++
      remainingQuota--
    }
  }

  return quotaPerBucket
}

export function trimDiagnosticsToMeetQuota(diagnosticsPerRule: Array<Array<Diagnostic>>, quota: number) {
  const diagnosticCountPerRule = diagnosticsPerRule.map((diagnostics) => diagnostics.length)
  const quotaPerRule = distributeQuota(diagnosticCountPerRule, quota)

  return diagnosticsPerRule.map((diagnostics, i) => diagnostics.slice(0, quotaPerRule[i]))
}

export const collapseDiagnostics = (diagnosticPerRule: Array<Array<Diagnostic>>) =>
  trimDiagnosticsToMeetQuota(diagnosticPerRule, DEFAULT_QUOTA)
