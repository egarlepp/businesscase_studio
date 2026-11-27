import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '../version';
import {
  CHANGELOG,
  LAST_SEEN_VERSION_KEY,
  MAX_CHANGELOG_ENTRIES,
  RECENT_RELEASES_SHOWN,
  readLastSeenVersion,
  writeLastSeenVersion,
} from './changelog';

const SEMVER = /^\d+\.\d+\.\d+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('CHANGELOG', () => {
  it('starts with the current app version', () => {
    expect(CHANGELOG[0]?.version).toBe(APP_VERSION);
  });

  it(`keeps at most ${MAX_CHANGELOG_ENTRIES} releases`, () => {
    expect(CHANGELOG.length).toBeLessThanOrEqual(MAX_CHANGELOG_ENTRIES);
    expect(RECENT_RELEASES_SHOWN).toBeLessThanOrEqual(MAX_CHANGELOG_ENTRIES);
  });

  it('has well-formed, unique, newest-first entries', () => {
    const versions = CHANGELOG.map((r) => r.version);
    expect(new Set(versions).size).toBe(versions.length);
    for (const release of CHANGELOG) {
      expect(release.version).toMatch(SEMVER);
      expect(release.date).toMatch(ISO_DATE);
      expect(Number.isNaN(Date.parse(release.date))).toBe(false);
      expect(release.title.trim()).not.toBe('');
      expect(release.changes.length).toBeGreaterThan(0);
    }
    const dates = CHANGELOG.map((r) => r.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

describe('last seen version storage', () => {
  it('round-trips through storage', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    } as unknown as Storage;
    expect(readLastSeenVersion(storage)).toBeNull();
    writeLastSeenVersion(storage, '1.2.3');
    expect(map.get(LAST_SEEN_VERSION_KEY)).toBe('1.2.3');
    expect(readLastSeenVersion(storage)).toBe('1.2.3');
  });

  it('tolerates missing or throwing storage', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(readLastSeenVersion(undefined)).toBeNull();
    expect(readLastSeenVersion(throwing)).toBeNull();
    expect(() => writeLastSeenVersion(throwing, '1.0.0')).not.toThrow();
    expect(() => writeLastSeenVersion(undefined, '1.0.0')).not.toThrow();
  });
});
