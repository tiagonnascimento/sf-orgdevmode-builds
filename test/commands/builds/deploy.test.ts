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

  const execSpawnSync = stub(BuildsUtils, 'spawnPromise').returns(
    new Promise((resolve, reject) => {
      resolve();
    })
  );
  const execReadFileSync = stub(BuildsUtils, 'execReadFileSync');
  execReadFileSync.onCall(0).returns(JSON.stringify(buildManifest1));
  execReadFileSync
    .onCall(1)
    .returns('<Package><types><members>BaseClassTest</members><name>ApexClass</name></types></Package>');
  execReadFileSync.onCall(2).returns('@IsTest() public class BaseClassTest');
  execReadFileSync.onCall(3).returns(JSON.stringify(buildManifest2));
  execReadFileSync.onCall(4).returns(JSON.stringify(buildManifest3));
  execReadFileSync.onCall(5).returns(JSON.stringify(buildManifest4));
  execReadFileSync
    .onCall(6)
    .returns(
      '<Package><types><members>BaseClass1Test</members><members>BaseClass2Test</members><name>ApexClass</name></types></Package>'
    );
  execReadFileSync.onCall(7).returns('@IsTest() public class BaseClass1Test');
  execReadFileSync.onCall(8).returns('@IsTest() public class BaseClass2Test');

  test
    .stdout()
    .do(() =>
      BuildsDeploy.run([
        '--buildfile',
        'path/to/buildfile.json',
        '--client-id',
        'client-id-123',
        '--instance-url',
        'https://login.salesforce.com/',
        '--username',
        'user@login.sample',
        '--jwt-key-file',
        'path/to/server.key',
      ])
    )
    .it('should execute the build with authentication', (ctx) => {
      expect(ctx.stdout).to.contain('sf org login jwt');
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('vlocity -sfdx.username');
      expect(ctx.stdout).to.contain('sf apex run');
      expect(ctx.stdout).to.contain('vlocity --nojob installVlocityInitial -sfdx.username user@login');
      expect(execSpawnSync.calledOnce).to.be.false;
      expect(execSpawnSync.firstCall.args[0]).to.equal('sf'); // auth
      expect(execSpawnSync.secondCall.args[0]).to.equal('sf'); // deploy
      expect(execSpawnSync.thirdCall.args[0]).to.equal('vlocity'); // deploy
    });

  test
    .stdout()
    .do(() => BuildsDeploy.run(['--buildfile', 'path/to/buildfile.json', '--target-org', 'alias']))
    .it('should execute the build without authenticating again with test level defined', (ctx) => {
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('NoTestRun');
      expect(ctx.stdout).to.not.contain('sf org login jwt');
      expect(ctx.stdout).to.not.contain('vlocity -sfdx.username');
    });

  test
    .stdout()
    .do(() => BuildsDeploy.run(['--buildfile', 'path/to/buildfile.json', '--target-org', 'alias']))
    .it('should execute the build without authenticating again and without test level defined on buildfile', (ctx) => {
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('RunLocalTest');
      expect(ctx.stdout).to.not.contain('sf org login jwt');
      expect(ctx.stdout).to.not.contain('vlocity -sfdx.username');
    });

  test
    .stdout()
    .do(() => BuildsDeploy.run(['--buildfile', 'path/to/buildfile.json', '--target-org', 'alias']))
    .it('should execute the build without authenticating again and with test level defined on buildfile', (ctx) => {
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('RunSpecifiedTests');
      expect(ctx.stdout).to.contain('--tests BaseClass1Test BaseClass2Test');
      expect(ctx.stdout).to.not.contain('sf org login jwt');
      expect(ctx.stdout).to.not.contain('vlocity -sfdx.username');
    });
});
