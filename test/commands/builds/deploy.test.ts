/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, test } from '@oclif/test';
import * as sinon from 'sinon';

// Import the BuildsDeploy command class
import BuildsDeploy, * as deploy from '../../../src/commands/builds/deploy';

describe('BuildsDeploy', () => {
  const buildManifest = {
    builds: [
      {
        type: 'metadata',
        manifestFile: 'path/to/package.xml',
      },
      {
        type: 'datapack',
        manifestFile: 'path/to/sfi-package.yaml',
      },
      {
        type: 'anonymousApex',
        apexScript: 'path/to/anonymousApex',
      },
    ],
  };

  const execCommandMock = sinon.stub(deploy, 'execCommand');
  sinon.stub(deploy, 'readBuildfile').returns(buildManifest);

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
    .it('should execute the BuildsDeploy command', (ctx) => {
      expect(execCommandMock.calledOnce).to.be.false;
      expect(execCommandMock.firstCall.args[0]).to.equal('sf'); // auth
      expect(execCommandMock.secondCall.args[0]).to.equal('sf'); // deploy
      expect(execCommandMock.thirdCall.args[0]).to.equal('vlocity'); // deploy
    });
});
