import assert from 'node:assert/strict';
import test from 'node:test';
import {
  burnTimeMinutes,
  formatBurnTime,
  type BurnTimeInput,
  type SkinType,
} from '../src/shared/lib/burn-time.ts';

const minutes = (skinType: SkinType, uvIndex: number, spf = 0, cloudCover = 0) =>
  burnTimeMinutes({ skinType, uvIndex, spf, cloudCover });

// Cases from nathancamm/tan BronzedTests/BronzedCalculatorTests.swift.
test('matches the app tests: zero when there is no UV', () => {
  assert.equal(minutes(2, 0, 30), 0);
  assert.equal(minutes(2, -1, 30), 0);
});

test('matches the app tests: more time with SPF', () => {
  assert.ok(minutes(3, 6, 30) > minutes(3, 6, 0));
});

test('matches the app tests: less time at higher UV', () => {
  assert.ok(minutes(3, 3, 30) > minutes(3, 9, 30));
});

test('matches the app tests: fairer skin has less time', () => {
  assert.ok(minutes(1, 6, 15) < minutes(6, 6, 15));
});

test('matches the app tests: cloud cover lengthens the estimate', () => {
  assert.ok(minutes(3, 6, 30, 1) > minutes(3, 6, 30, 0));
});

// Vectors: [skin type, UV, SPF, cloud fraction, exact minutes, app wording].
// The exact values were confirmed bit for bit against the app's Swift code.
const vectors: Array<[SkinType, number, number, number, number, string]> = [
  [2, 6, 0, 0, 12, '12 min'],
  [2, 8, 0, 0, 9, '9 min'],
  [1, 8, 0, 0, 6, '6 min'],
  [1, 12, 0, 0, 4, '4 min'],
  [1, 16, 0, 0, 3, '3 min'],
  [2, 11, 0, 0, 6.545454545454546, '6 min'],
  [6, 11, 0, 0, 26.181818181818183, '26 min'],
  [3, 6, 0, 1, 26.666666666666664, '26 min'],
  [2, 7, 0, 0.1, 10.549450549450551, '10 min'],
  [3, 7, 0, 0.1, 17.582417582417584, '17 min'],
  [5, 10, 0, 0.75, 29.538461538461544, '29 min'],
  [1, 7, 15, 0.1, 105.49450549450549, '105 min'],
  [4, 9, 15, 0.25, 298.6666666666667, '4 hr'],
  [3, 7, 30, 0.1, 527.4725274725275, '8+ hr'],
  [6, 1, 50, 1, 19200, '8+ hr'],
  [2, 0, 30, 0, 0, '—'],
];

test('reproduces the app result for each vector', () => {
  for (const [skinType, uvIndex, spf, cloudCover, exact, wording] of vectors) {
    const input: BurnTimeInput = { skinType, uvIndex, spf, cloudCover };
    const result = burnTimeMinutes(input);
    assert.equal(result, exact, JSON.stringify(input));
    assert.equal(formatBurnTime(result), wording, JSON.stringify(input));
  }
});

test('treats SPF 0 and SPF 1 as no sunscreen, like the app', () => {
  assert.equal(minutes(2, 8, 0), minutes(2, 8, 1));
  assert.equal(minutes(2, 8, 30), minutes(2, 8, 0) * 30);
});

test('applies the full 80% margin and the cloud limit', () => {
  // Type IV at UV 6 has a 35 minute base; 80% of it is 28 minutes.
  assert.equal(minutes(4, 6), 28);
  // Full cloud lengthens the estimate by a third, never more.
  assert.equal(minutes(4, 6, 0, 1), 28 / 0.75);
});

test('keeps UV 11 and above on the same curve', () => {
  assert.ok(minutes(6, 16) < minutes(6, 11));
  assert.equal(formatBurnTime(minutes(6, 16)), '18 min');
});

test('returns no estimate for a missing UV value', () => {
  assert.equal(minutes(3, Number.NaN), 0);
  assert.equal(formatBurnTime(minutes(3, Number.NaN)), '—');
});

test('formats like the app dashboard tile', () => {
  assert.equal(formatBurnTime(0), '—');
  assert.equal(formatBurnTime(0.5), '0 min');
  assert.equal(formatBurnTime(9.999), '9 min');
  assert.equal(formatBurnTime(119.9), '119 min');
  assert.equal(formatBurnTime(120), '2 hr');
  assert.equal(formatBurnTime(479.9), '7 hr');
  assert.equal(formatBurnTime(480), '8+ hr');
});
