export function findLast(array, conditionFn) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (conditionFn(array[i])) {
      return array[i]
    }
  }
}

export function findLastIndex(array, conditionFn) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (conditionFn(array[i])) {
      return i
    }
  }

  return -1
}
