import { expect } from 'chai';
import { parseBuildfile, BuildfileValidationError } from '../../src/domain/parser.js';

describe('parseBuildfile', () => {
  it('parses a valid buildfile and infers discriminated-union variants', () => {
    const raw = JSON.stringify({
      builds: [
        { type: 'metadata', manifestFile: 'package.xml', enableTracking: true },
        { type: 'datapack', manifestFile: 'job.yaml' },
        { type: 'anonymousApex', apexScript: 'script.apex' },
        { type: 'command', command: 'echo hi', addTargetOrg: true },
      ],
    });

    const buildfile = parseBuildfile(raw);

    expect(buildfile.builds).to.have.length(4);
    const [first] = buildfile.builds;
    expect(first.type).to.equal('metadata');
    if (first.type === 'metadata') {
      expect(first.manifestFile).to.equal('package.xml');
      expect(first.enableTracking).to.equal(true);
    }
  });

  it('throws BuildfileValidationError on malformed JSON', () => {
    expect(() => parseBuildfile('{ not json')).to.throw(BuildfileValidationError, /not valid JSON/);
  });

  it('rejects a metadata step missing its required manifestFile', () => {
    const raw = JSON.stringify({ builds: [{ type: 'metadata' }] });
    expect(() => parseBuildfile(raw)).to.throw(BuildfileValidationError, /manifestFile/);
  });

  it('rejects an unknown build type', () => {
    const raw = JSON.stringify({ builds: [{ type: 'mystery' }] });
    expect(() => parseBuildfile(raw)).to.throw(BuildfileValidationError);
  });

  it('rejects an empty builds array', () => {
    const raw = JSON.stringify({ builds: [] });
    expect(() => parseBuildfile(raw)).to.throw(BuildfileValidationError);
  });

  it('rejects enableTracking when it is not a boolean (the old latent bug)', () => {
    const raw = JSON.stringify({ builds: [{ type: 'metadata', manifestFile: 'p.xml', enableTracking: 'true' }] });
    expect(() => parseBuildfile(raw)).to.throw(BuildfileValidationError, /enableTracking/);
  });

  it('rejects unknown properties on a step (strict schema)', () => {
    const raw = JSON.stringify({ builds: [{ type: 'datapack', manifestFile: 'j.yaml', bogus: 1 }] });
    expect(() => parseBuildfile(raw)).to.throw(BuildfileValidationError);
  });

  it('accepts a numeric timeout and normalizes it to a string', () => {
    const raw = JSON.stringify({ builds: [{ type: 'metadata', manifestFile: 'p.xml', timeout: 60 }] });
    const [build] = parseBuildfile(raw).builds;
    if (build.type === 'metadata') {
      expect(build.timeout).to.equal('60');
    }
  });

  it('accepts a numeric-string timeout', () => {
    const raw = JSON.stringify({ builds: [{ type: 'metadata', manifestFile: 'p.xml', timeout: '90' }] });
    const [build] = parseBuildfile(raw).builds;
    if (build.type === 'metadata') {
      expect(build.timeout).to.equal('90');
    }
  });

  it('rejects a non-numeric timeout instead of stringifying garbage (z.coerce.string was too loose)', () => {
    const raw = JSON.stringify({ builds: [{ type: 'metadata', manifestFile: 'p.xml', timeout: true }] });
    expect(() => parseBuildfile(raw)).to.throw(BuildfileValidationError, /timeout/);
  });
});
