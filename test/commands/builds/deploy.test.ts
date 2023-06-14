import { expect, test } from '@oclif/test';

describe('builds deploy', () => {
  test
    .stdout()
    .command(['builds deploy', '--buildfile', 'package.json'])
    .it('runs with buildfile', (ctx) => {
      expect(ctx.stdout).to.contain('package.json');
    });
});
