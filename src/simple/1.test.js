import { testProp, fc } from 'ava-fast-check'
import { map, is, pick } from 'ramda'

const lambda = async api => {
  const apiResult = await api.get()
  return pick(['foo', 'bar', 'baz'], apiResult)
}

const simpleAPI = fc.oneof(
  fc.record({
    get: fc.oneof(
      fc.object(),
      // fc.constant(undefined),
      fc.record({
        foo: fc.anything(),
        bar: fc.anything(),
        baz: fc.anything()
      })
    )
  })
)

testProp('should always return an object',
  [simpleAPI],
  async api => {
    api = map(x => () => Promise.resolve(x), api)
    return is(Object, await lambda(api))
  },
  { numRuns: 5000 }
)

testProp('should have no more than 3 keys',
  [simpleAPI],
  async api => {
    api = map(x => () => Promise.resolve(x), api)
    return Object.keys(await lambda(api)).length <= 3
  },
  { numRuns: 5000 }
)
