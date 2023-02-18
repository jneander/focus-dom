const originalMocha = {
  describe: window.describe,
  describeOnly: window.describe.only,
  describeSkip: window.describe.skip,
}

type Describe = typeof describe | typeof describe.only | typeof describe.skip

function wrapDescribeFn<T extends Describe>(describeFn: T): T {
  return function (originalTitle, specFn) {
    const [innerTitle, ...titles] = originalTitle.split(/\s+>\s+/).reverse()
    const innerDescribe = () => describeFn(innerTitle, specFn)

    const result = titles.reduce(function (currentSpecFn, currentTitle) {
      return function () {
        return describeFn(currentTitle, currentSpecFn)
      }
    }, innerDescribe)

    return result()
  } as T
}

window.describe = wrapDescribeFn(originalMocha.describe)
window.describe.only = wrapDescribeFn(originalMocha.describeOnly)
window.describe.skip = wrapDescribeFn(originalMocha.describeSkip)
