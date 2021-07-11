Idea:

Unified Settings system to manage all your known apps (App-Key) with settings and schema.

- App defined with app key

- list existing peers on given app(appKey)
- settings Version (count of set settings + set schema events)
- Schema with migration for existing settings

- get setting for specific machine
- subscribe on settings (changes)
- default settings

- set settings for multiple peers (merging settings objects) (push partial settings)
- use braced expressions or an array to set(peers and scope)
  e.g: mkdir name-{test,temp}-{{01..19},{a..c}}
  https://tldp.org/en/abs-guide/ch03.html#braceexpref
  https://www.npmjs.com/package/brace-expansion
- feedback applied setting Version (last seen)
