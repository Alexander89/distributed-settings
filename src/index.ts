import { CancelSubscription, Pond } from '@actyx/pond'

/**
 * creates a new Settings instance
 */
export type SettingsFactory = (actyx: Pond) => Settings

export type Schema<T> = string
export type Migration<T> = string

/**
 * Result if all known peers applied the new settings or definition
 */
export type PeerResponseSucceeded = {
  /// response type
  response: 'succeeded'
  /// list of updated peers
  updatedPeers: string[]
}
/**
 * Result if some known peers applied the new settings or definition and some did not
 */
export type PeerResponsePartial = {
  /// response type
  response: 'partial'
  /// list of updated peers
  updatedPeers: string[]
  /// list of peers who did not apply jet
  missingPeers: string[]
}
/**
 * Result if no peer applied the new settings or definition now
 */
export type PeerResponseNoResponse = {
  /// response type
  response: 'noResponse'
  /// list of peers who did not apply jet
  missingPeers: string[]
}
/**
 * Possible response when a setting is set, unset or defined
 */
export type PeerResponse = PeerResponseSucceeded | PeerResponsePartial | PeerResponseNoResponse

/**
 * Settings for a App.
 * @typedef T Definition of the Settings data.
 */
export type AppSettings<T> = {
  /**
   * Returns a list with all known peers for this app.
   *
   * Hint: Peers are added, as soon they apply a configuration
   */
  listPeers: () => Promise<ReadonlyArray<string>>
  /**
   * Returns a map of all known peers and the current applied settings version
   */
  listPeerVersions: () => Promise<Record<string, number>>
  /**
   * Returns the schema of the app
   */
  getSchema: <T>() => Promise<Schema<T> | undefined>
  /**
   * define the first/a new version for the current application. It includes the default
   * settings, a schema and a migration to update the current version if exists
   *
   * @param defaultSetting settings, new peers will get
   * @param schema schema to validate the new settings and all set and setPartial events
   * @param migration migration to update existing settings
   * @param timeout time to pass to wait for the PeerResponse
   * @returns PeerResponse with 'successful' | 'partial' | 'noReply' feedback
   */
  defineSettings: (
    schema: Schema<T>,
    defaultSetting: T,
    migration: unknown,
    timeout?: number,
  ) => Promise<PeerResponse>
  verifySettings: (
    schema: Schema<T>,
    defaultSetting: T,
    migration: unknown,
  ) => Promise<Record<string, boolean>>
  /**
   * Set the settings for a specific peer. If a scope is given, only the selected setting is updated
   * @param peers array of peers or brace-expression of peers to update
   * @param value new value or setting, depends to the scope
   * @param scope scope (brace-expression) or undefined. Is the scope set, only this portion of the settings are replaced
   * @param timeout time to pass to wait for the PeerResponse
   * @returns PeerResponse with 'successful' | 'partial' | 'noReply' feedback
   */
  set: (
    peers: string | string[],
    value: any,
    scope?: string,
    timeout?: number,
  ) => Promise<PeerResponse>
  /**
   * Set a selected part of the settings back to the default settings.
   * @param peers array of peers or brace-expression of peers to update
   * @param scope scope (brace-expression) or undefined. Is the scope set, only this portion of the settings are replaced
   * @param timeout time to pass to wait for the PeerResponse
   * @returns PeerResponse with 'successful' | 'partial' | 'noReply' feedback
   */
  unset: (peers: string | string[], scope: string, timeout?: number) => Promise<PeerResponse>

  /**
   * Subscribe to the settings of an given peer. Each time the definition or the settings changes, the handler get called.
   *
   * @param peers local peer name
   * @param cb handler to receive the updated settings. If it returns true, the settingsAppliedEvent get emitted. It is highly recommended, that only the settings receiver (single node) should return true.
   * @returns function to cancel the subscription
   */
  subscribe: (peer: string, cb: (settings: T | undefined) => boolean) => CancelSubscription
  /**
   * Get the settings of an given peer. After that, the settingsAppliedEvent is emitted.
   *
   * It is highly recommended, that only the settings receiver (single node) should use this getter. If you wont to spy on other settings, use subscribe and return false if you receive the settings.
   *
   * @param peers local peer name
   * @returns settings or undefined if no settings are defined
   */
  get: (peer: string) => Promise<T | undefined>
}

/**
 * Settings instance.
 *
 * App specific settings are wrapped in the `app('appId')`
 */
export type Settings = {
  /**
   * open the settings for a given appId
   */
  app: <T>(appId: string) => AppSettings<Readonly<T>>
  /**
   * List all apps, known in actyx
   */
  listApps: () => Promise<ReadonlyArray<string>>
}
