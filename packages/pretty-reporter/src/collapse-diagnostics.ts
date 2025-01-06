import { Diagnostic } from '@steiger/types'

const DIAGNOSTIC_QUOTA = 20

function distributeQuota(buckets: Array<number>, quota: number) {
  const allItems = buckets.reduce((acc, bucket) => acc + bucket, 0)
  const quotaPerBucket = buckets.slice(0).fill(0)
  let remainingQuota = quota

  for (let i = 0; remainingQuota > 0; i += 1) {
    const numOfItemsInBucket = buckets[i]
    const assignedQuotaForBucket = quotaPerBucket[i]

    // If it went beyond the last bucket, start from the first one
    if (numOfItemsInBucket === undefined) {
      i = -1
      continue
    }

    // If the bucket already has the quota distributed for it or does not contain any items, skip it
    if (assignedQuotaForBucket < numOfItemsInBucket && numOfItemsInBucket !== 0) {
      quotaPerBucket[i] += 1
      remainingQuota -= 1
    }

    // If it ran out of the items earlier than the quota, break
    if (allItems === quota - remainingQuota) {
      break
    }
  }

  return quotaPerBucket
}

function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const severityOrder = { error: 1, warn: 2 }

  return diagnostics.slice(0).sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

// Export for testing purposes to be able to pass a custom quota
export function trimDiagnosticsToMeetQuota(diagnosticsPerRule: Array<Array<Diagnostic>>, quota: number) {
  const diagnosticCountPerRule = diagnosticsPerRule.map((diagnostics) => diagnostics.length)
  const quotaPerRule = distributeQuota(diagnosticCountPerRule, quota)
  const sortedDiagnosticsPerRule = diagnosticsPerRule.map((diagnostics) => sortDiagnostics(diagnostics))

  return sortedDiagnosticsPerRule.map((diagnostics, i) => diagnostics.slice(0, quotaPerRule[i]))
}

export const collapseDiagnostics = (diagnosticPerRule: Array<Array<Diagnostic>>) =>
  trimDiagnosticsToMeetQuota(diagnosticPerRule, DIAGNOSTIC_QUOTA)
