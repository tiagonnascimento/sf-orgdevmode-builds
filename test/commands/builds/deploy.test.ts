/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, test } from '@oclif/test';
import pkg from 'sinon';
const { stub } = pkg;
// Import the BuildsDeploy command class
import BuildsDeploy from '../../../src/commands/builds/deploy.js';
import BuildsUtils from '../../../src/modules/utils.js';

describe('BuildsDeploy', () => {
  const buildManifest1 = {
    builds: [
      {
        type: 'metadata',
        manifestFile: 'path/to/package.xml',
        testLevel: 'RunSpecifiedTests',
        preDestructiveChanges: 'path/to/preDestructiveChanges.xml',
        postDestructiveChanges: 'path/to/postDestructiveChanges.xml',
        ignoreWarnings: true,
        timeout: 60,
        enableTracking: true,
      },
      {
        type: 'datapack',
        manifestFile: 'path/to/sfi-package.yaml',
      },
      {
        type: 'anonymousApex',
        apexScript: 'path/to/anonymousApex',
      },
      {
        type: 'command',
        command: 'vlocity --nojob installVlocityInitial',
        addTargetOrg: true,
        targetOrgFormat: '-sfdx.username',
      },
    ],
  };

  const buildManifest2 = {
    builds: [
      {
        type: 'metadata',
        manifestFile: 'path/to/package.xml',
        testLevel: 'NoTestRun',
      },
    ],
  };

  const buildManifest3 = {
    builds: [
      {
        type: 'metadata',
        manifestFile: 'path/to/package.xml',
      },
    ],
  };

  const buildManifest4 = {
    builds: [
      {
        type: 'metadata',
        manifestFile: 'path/to/package.xml',
        testLevel: 'RunSpecifiedTests',
        ignoreWarnings: true,
        timeout: 60,
        enableTracking: true,
      },
    ],
  };

  // Declare stubs here, but don't configure their behavior globally
  let execSpawnSync: pkg.SinonStub;
  let execReadFileSync: pkg.SinonStub;

  // Use beforeEach to set up a clean stub for each test
  // This stub for spawnPromise will be the default, and can be overridden per test if needed.
  beforeEach(() => {
    // Restore any previously created stubs to ensure a clean slate for each test
    pkg.restore(); // Restores all stubs created with sinon.stub()

    execSpawnSync = stub(BuildsUtils, 'spawnPromise');
    execSpawnSync.returns(Promise.resolve()); // Default successful resolution
    // Do NOT configure execReadFileSync globally here with .onCall()
    // It will be configured per test using `do(ctx => { ... })`
    execReadFileSync = stub(BuildsUtils, 'execReadFileSync');
  });

  // Since pkg.restore() is called in beforeEach, an afterEach is technically redundant for global restore,
  // but it's good practice to have if you manually create stubs not covered by pkg.restore()
  afterEach(() => {
    // Ensuring all stubs are clean after each test
    pkg.restore();
  });

  // --- Test 1: Should execute the build with authentication ---
  test
    .stdout()
    .do(() => {
      // Configure execReadFileSync specifically for this test's needs
      execReadFileSync.onCall(0).returns(JSON.stringify(buildManifest1)); // Reads the buildfile
      execReadFileSync.onCall(1).returns('<Package><types><members>BaseClassTest</members><name>ApexClass</name></types></Package>'); // Reads the package XML for test classes
      execReadFileSync.onCall(2).returns('@IsTest() public class BaseClassTest'); // Reads the Apex class content

      return BuildsDeploy.run([
        '--buildfile', 'path/to/buildfile.json',
        '--client-id', 'client-id-123',
        '--instance-url', 'https://login.salesforce.com/',
        '--username', 'user@login.sample',
        '--jwt-key-file', 'path/to/server.key',
      ]);
    })
    .it('should execute the build with authentication', (ctx) => {
      expect(ctx.stdout).to.contain('sf org login jwt');
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('vlocity -sfdx.username');
      expect(ctx.stdout).to.contain('sf apex run');
      expect(ctx.stdout).to.contain('vlocity --nojob installVlocityInitial -sfdx.username user@login');

      // Assertions for execReadFileSync calls
      expect(execReadFileSync.callCount).to.equal(3);
      expect(execReadFileSync.getCall(0).args[0]).to.equal('path/to/buildfile.json');
      expect(execReadFileSync.getCall(1).args[0]).to.equal('path/to/package.xml');
      expect(execReadFileSync.getCall(2).args[0]).to.equal('force-app/main/default/classes/BaseClassTest.cls');

      // Assertions for execSpawnSync calls
      expect(execSpawnSync.callCount).to.equal(5);
      expect(execSpawnSync.getCall(0).calledWith('sf')).to.be.true;
      expect(execSpawnSync.getCall(1).calledWith('sf')).to.be.true;
      expect(execSpawnSync.getCall(2).calledWith('vlocity')).to.be.true;
      expect(execSpawnSync.getCall(3).calledWith('sf')).to.be.true;
      expect(execSpawnSync.getCall(4).calledWith('vlocity')).to.be.true;
    });

  // --- Test 2: Should execute the build without authenticating again with test level defined ---
  test
    .stdout()
    .do(() => {
      // Configure execReadFileSync specifically for this test
      execReadFileSync.onCall(0).returns(JSON.stringify(buildManifest2)); // Reads the buildfile

      return BuildsDeploy.run(['--buildfile', 'path/to/buildfile.json', '--target-org', 'alias']);
    })
    .it('should execute the build without authenticating again with test level defined', (ctx) => {
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('NoTestRun');
      expect(ctx.stdout).to.not.contain('sf org login jwt');
      expect(ctx.stdout).to.not.contain('vlocity -sfdx.username');

      // Assertions for execReadFileSync calls
      expect(execReadFileSync.callCount).to.equal(1);
      expect(execReadFileSync.getCall(0).args[0]).to.equal('path/to/buildfile.json');

      // Assertions for execSpawnSync calls
      expect(execSpawnSync.callCount).to.equal(2);
      expect(execSpawnSync.getCall(0).calledWith('sf')).to.be.true;
      expect(execSpawnSync.getCall(1).calledWith('sf')).to.be.true;
    });

  // --- Test 3: Should execute the build without authenticating again and without test level defined on buildfile ---
  test
    .stdout()
    .do(() => {
      // Configure execReadFileSync specifically for this test
      execReadFileSync.onCall(0).returns(JSON.stringify(buildManifest3)); // Reads the buildfile

      return BuildsDeploy.run(['--buildfile', 'path/to/buildfile.json', '--target-org', 'alias']);
    })
    .it('should execute the build without authenticating again and without test level defined on buildfile', (ctx) => {
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('RunLocalTest'); // Default test level
      expect(ctx.stdout).to.not.contain('sf org login jwt');
      expect(ctx.stdout).to.not.contain('vlocity -sfdx.username');

      // Assertions for execReadFileSync calls
      expect(execReadFileSync.callCount).to.equal(1);
      expect(execReadFileSync.getCall(0).args[0]).to.equal('path/to/buildfile.json');

      // Assertions for execSpawnSync calls
      expect(execSpawnSync.callCount).to.equal(2);
      expect(execSpawnSync.getCall(0).calledWith('sf')).to.be.true;
      expect(execSpawnSync.getCall(1).calledWith('sf')).to.be.true;
    });

  // --- Test 4: Should execute the build without authenticating again and with test level defined on buildfile ---
  test
    .stdout()
    .do(() => {
      // Configure execReadFileSync specifically for this test
      execReadFileSync.onCall(0).returns(JSON.stringify(buildManifest4)); // Reads the buildfile
      execReadFileSync.onCall(1).returns('<Package><types><members>BaseClass1Test</members><members>BaseClass2Test</members><name>ApexClass</name></types></Package>'); // Reads the package XML
      execReadFileSync.onCall(2).returns('@IsTest() public class BaseClass1Test'); // Reads BaseClass1Test content
      execReadFileSync.onCall(3).returns('@IsTest() public class BaseClass2Test'); // Reads BaseClass2Test content

      return BuildsDeploy.run(['--buildfile', 'path/to/buildfile.json', '--target-org', 'alias']);
    })
    .it('should execute the build without authenticating again and with test level defined on buildfile', (ctx) => {
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('RunSpecifiedTests');
      expect(ctx.stdout).to.contain('--tests BaseClass1Test BaseClass2Test');
      expect(ctx.stdout).to.not.contain('sf org login jwt');
      expect(ctx.stdout).to.not.contain('vlocity -sfdx.username');

      // Assertions for execReadFileSync calls
      expect(execReadFileSync.callCount).to.equal(4);
      expect(execReadFileSync.getCall(0).args[0]).to.equal('path/to/buildfile.json');
      expect(execReadFileSync.getCall(1).args[0]).to.equal('path/to/package.xml');
      expect(execReadFileSync.getCall(2).args[0]).to.equal('force-app/main/default/classes/BaseClass1Test.cls');
      expect(execReadFileSync.getCall(3).args[0]).to.equal('force-app/main/default/classes/BaseClass2Test.cls');

      // Assertions for execSpawnSync calls
      expect(execSpawnSync.callCount).to.equal(1);
      expect(execSpawnSync.getCall(0).calledWith('sf')).to.be.true;
    });

  // --- Test 5: Should execute the build starting at the step 2 of the build file ---
  test
    .stdout()
    .do(() => {
      // Configure execReadFileSync specifically for this test
      execReadFileSync.onCall(0).returns(JSON.stringify(buildManifest1)); // Reads the buildfile (as it should still be read)

      return BuildsDeploy.run([
        '--buildfile', 'path/to/buildfile.json',
        '--target-org', 'alias',
        '--initial-step', '2' // This should make the command skip metadata deploy and start from datapack or anonymousApex
      ]);
      return null;
    })
    .it('should execute the build starting at the step 2 of the build file', (ctx) => {
      expect(ctx.stdout).to.not.contain('sf org login jwt');
      expect(ctx.stdout).to.not.contain('sf project deploy start');
      expect(ctx.stdout).to.not.contain('vlocity -sfdx.username');
      expect(ctx.stdout).to.contain('sf apex run');
      expect(ctx.stdout).to.contain('vlocity --nojob installVlocityInitial');

      // Assertions for execReadFileSync calls
      expect(execReadFileSync.callCount).to.equal(1);
      expect(execReadFileSync.getCall(0).args[0]).to.equal('path/to/buildfile.json');

      // Assertions for execSpawnSync calls
      expect(execSpawnSync.callCount).to.equal(2);
      expect(execSpawnSync.getCall(0).calledWith('sf')).to.be.true;
      expect(execSpawnSync.getCall(1).calledWith('vlocity')).to.be.true;
    });
});