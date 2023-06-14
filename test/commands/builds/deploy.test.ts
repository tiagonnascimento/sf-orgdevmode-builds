import { expect, test } from '@oclif/test';

describe('builds deploy', () => {
  test
    .stdout()
    .command(['builds deploy'])
    .it('runs hello', (ctx) => {
      expect(ctx.stdout).to.contain('hello world');
    });

  test
    .stdout()
    .command(['builds deploy', '--name', 'Astro'])
    .it('runs hello --name Astro', (ctx) => {
      expect(ctx.stdout).to.contain('hello Astro');
    });
});
