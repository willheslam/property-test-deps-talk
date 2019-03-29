import { testProp, fc } from 'ava-fast-check'
import { is, pickAll, defaultTo, allPass, has } from 'ramda'

const lambda = async api => {
  const apiResult = await api.get()
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
      .map(x => () => Promise.resolve(x))
  })
)

// const simpleAPI = fc.oneof(
//   fc.record({
//     get: fc.oneof(
//       fc.object(),
//       fc.constant(undefined),
//       fc.record({
//         foo: fc.anything(),
//         bar: fc.anything(),
//         baz: fc.anything()
//       })
//     )
//       .chain(x => fc.oneof(
//         fc.constant(() => Promise.resolve(x)),
//         fc.constant(() => { throw new Error('oops!') })
//       ))
//   })
// )

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
