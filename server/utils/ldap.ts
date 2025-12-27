import { Client } from 'ldapts';
import { ConnectionOptions } from 'tls';

export class LdapWrapper {
  public client: Client;
  private _boundDN: string | null = null;
  private _boundPassword: string | null = null; // Stored to allow rebinding

  constructor(url: string, tlsOptions?: ConnectionOptions) {
    this.client = new Client({ url, tlsOptions });
  }

  async bind(dn: string, pass: string) {
    await this.client.bind(dn, pass);
    this._boundDN = dn;
    this._boundPassword = pass;
  }

  /**
   * Switches to Admin, performs a task, then reverts to the previous user.
   */
  async runAsAdmin<T>(adminDn: string, adminPass: string, task: (client: Client) => Promise<T>): Promise<T> {
    const previousDN = this._boundDN;
    const previousPass = this._boundPassword;

    try {
      // 1. Bind as Admin
      await this.client.bind(adminDn, adminPass);
      // 2. Perform the search or operation
      return await task(this.client);
    } finally {
      // 3. Rebind to the previous user (if there was one)
      if (previousDN && previousPass) {
        await this.client.bind(previousDN, previousPass);
      } else {
        this._boundDN = null;
        this._boundPassword = null;
      }
    }
  }

  get isBound() { return !!this._boundDN; }
  get currentDN() { return this._boundDN; }
  async unbind() {
    if (!this.isBound) return;
    await this.client.unbind();
  }
}