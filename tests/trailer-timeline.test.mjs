import test from 'node:test'
import assert from 'node:assert/strict'
import { trailerSampleIndexAt } from '../lib/trailer-timeline.ts'

const sample = (timestamp) => ({
  timestamp,
  average: '#111111',
  left: '#111111',
  center: '#111111',
  right: '#111111',
  top: '#111111',
  bottom: '#111111',
})
const timeline = [0, 4, 8, 12, 16].map(sample)

test('trailer timeline lookup follows playback and handles forward/backward seeks', () => {
  assert.equal(trailerSampleIndexAt(timeline, 0), 0)
  assert.equal(trailerSampleIndexAt(timeline, 7.99, 1), 1)
  assert.equal(trailerSampleIndexAt(timeline, 15, 1), 3)
  assert.equal(trailerSampleIndexAt(timeline, 3, 3), 0)
  assert.equal(trailerSampleIndexAt(timeline, 500, 0), 4)
  assert.equal(trailerSampleIndexAt([], 8), -1)
})
