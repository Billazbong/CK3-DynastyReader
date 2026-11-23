# Local save library

## Goal

Keep imported CK3 saves and parsed character profiles available in the current browser without an application server or external database.

## Storage

The browser library uses IndexedDB:

- Database: `ck3-dynasty-reader`
- Object store: `saves`
- Key: unique library record ID
- Fields: original file Blob, file name, size, type, stored date, normalized profile

The original `.ck3` archive remains browser-local. It is not uploaded, sent to Cloudflare, or shared between devices.

## Operations

- Import: parse first, then store the original file and parsed profile.
- Open: load the saved profile immediately.
- Delete: remove one record.
- Clear: remove every record in the current browser.

Deleting browser site data or the IndexedDB database removes the library. Private browsing may discard records when the session closes.

## Privacy

Cloudflare Pages serves static application assets only. The app uses no API, function, database service, analytics endpoint, or save-file network request.

The CSP sets `connect-src 'none'` to prevent application network connections after loading.

## Cloudflare Pages

The build output is `dist`. Deploy with:

```bash
npm run build
npm run deploy
```

Set the Cloudflare account/project authorization in your environment or Wrangler login. Deployment credentials are not stored in the repository.
