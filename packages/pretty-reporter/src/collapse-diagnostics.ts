import { Diagnostic } from '@steiger/types'

const DIAGNOSTIC_QUOTA = 20

function distributeQuota(buckets: Array<number>, quota: number) {
  const allItemsCount = buckets.reduce((acc, bucket) => acc + bucket, 0)
  const quotaPerBucket = buckets.slice(0).fill(0)
  let remainingQuota = Math.min(quota, allItemsCount)
  let i = 0

  while (remainingQuota > 0) {
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
  }

  return quotaPerBucket
}

function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const severityOrder = { error: 1, warn: 2 }

  return diagnostics.slice(0).sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

export function collapseDiagnostics(diagnosticsPerRule: Array<Array<Diagnostic>>) {
  const diagnosticCountPerRule = diagnosticsPerRule.map((diagnostics) => diagnostics.length)
  const quotaPerRule = distributeQuota(diagnosticCountPerRule, DIAGNOSTIC_QUOTA)
  const sortedDiagnosticsPerRule = diagnosticsPerRule.map((diagnostics) => sortDiagnostics(diagnostics))

  return sortedDiagnosticsPerRule.map((diagnostics, i) => diagnostics.slice(0, quotaPerRule[i]))
}
