import { testProp, fc } from 'ava-fast-check'
import { is, pickAll, defaultTo, allPass, has, propIs } from 'ramda'

const lambda = async api => {
  let apiResult
  try {
    for (let i = 0; i < 30; i++) {
      apiResult = await api.get()
      if (apiResult) { break }
    }
  } catch (error) {
    apiResult = {}
  }
  return pickAll(['foo', 'bar', 'baz'], defaultTo({}, apiResult))
}

const simpleAPI = fc.oneof(
  fc.record({
    get: fc.oneof(
      fc.object(),
      fc.constant(undefined),
      fc.record({
        foo: fc.anything(),
        bar: fc.anything(),
        baz: fc.anything()
      })
    )
      .chain(x => fc.oneof(
        fc.constant(() => Promise.resolve(x)),
        fc.constant(() => { throw new Error('oops!') })
      ))
  })
)

const reticentAPI = howReticent => fc.record({
  get: fc.record({
    foo: fc.string(),
    bar: fc.string(),
    baz: fc.string()
  })
    .chain(data => fc.nat(howReticent)
      .map(threshold => {
        let progress = 0
        return () => {
          progress++
          if (progress < threshold) {
            return null
          } else {
            return data
          }
        }
      })
    )
})

testProp('should always return an object',
  [simpleAPI],
  async api => {
    return is(Object, await lambda(api))
  },
  { numRuns: 5000 }
)

testProp('should have no more than 3 keys',
  [simpleAPI],
  async api => {
    return Object.keys(await lambda(api)).length <= 3
  },
  { numRuns: 5000 }
)

testProp('should have foo, bar, baz',
  [simpleAPI],
  async api => {
    return allPass([has('foo'), has('bar'), has('baz')])(await lambda(api))
  },
  { numRuns: 5000 }
)

testProp('a reticent API should eventually give back a valid answer',
  [reticentAPI(20)],
  async api => {
    return allPass([propIs(String, 'foo'), propIs(String, 'bar'), propIs(String, 'baz')])(await lambda(api))
  }
)
