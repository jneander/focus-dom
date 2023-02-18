export function findLast<T>(array: T[], conditionFn: (item: T) => boolean): T | undefined {
  for (let i = array.length - 1; i >= 0; i--) {
    if (conditionFn(array[i])) {
      return array[i]
    }
  }
}

export function findLastIndex<T>(array: T[], conditionFn: (item: T) => boolean): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (conditionFn(array[i])) {
      return i
    }
  }

  return -1
}
