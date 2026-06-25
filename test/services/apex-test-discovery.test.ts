import { expect } from 'chai';
import { ApexTestDiscovery } from '../../src/services/apex-test-discovery.js';
import { FakeFileReader } from '../helpers.js';

describe('ApexTestDiscovery', () => {
  it('returns only @IsTest classes referenced by the manifest', async () => {
    const files = {
      'pkg.xml':
        '<Package><types><members>FooTest</members><members>Bar</members><name>ApexClass</name></types></Package>',
      'classes/FooTest.cls': '@isTest\npublic class FooTest {}',
      'classes/Bar.cls': 'public class Bar {}',
    };
    const discovery = new ApexTestDiscovery(new FakeFileReader(files));
    const result = await discovery.getTestClasses('pkg.xml', 'classes');
    expect(result).to.deep.equal(['FooTest']);
  });

  it('uses the default classes folder when none is provided', async () => {
    const files = {
      'pkg.xml': '<Package><types><members>FooTest</members><name>ApexClass</name></types></Package>',
      'force-app/main/default/classes/FooTest.cls': '@IsTest public class FooTest {}',
    };
    const discovery = new ApexTestDiscovery(new FakeFileReader(files));
    const result = await discovery.getTestClasses('pkg.xml');
    expect(result).to.deep.equal(['FooTest']);
  });

  it('returns an empty array when the manifest has no ApexClass type', async () => {
    const files = { 'pkg.xml': '<Package><types><members>MyLayout</members><name>Layout</name></types></Package>' };
    const discovery = new ApexTestDiscovery(new FakeFileReader(files));
    const result = await discovery.getTestClasses('pkg.xml');
    expect(result).to.deep.equal([]);
  });

  it('returns an empty array (not a TypeError) for an ApexClass type with no members', async () => {
    const files = { 'pkg.xml': '<Package><types><name>ApexClass</name></types></Package>' };
    const discovery = new ApexTestDiscovery(new FakeFileReader(files));
    const result = await discovery.getTestClasses('pkg.xml');
    expect(result).to.deep.equal([]);
  });
});
