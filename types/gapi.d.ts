// Google API Client Library 型定義
declare namespace gapi {
  let auth: {
    setToken: (token: {
      access_token: string
      expires_in: string
      error: string
      state: string
    }) => void
  }

  let auth2: {
    init: (options: {
      apiKey: string
      clientId: string
      discoveryDocs: string[]
      scope: string
    }) => Promise<void>
    getAuthInstance: () => {
      signIn: () => Promise<void>
      signOut: () => Promise<void>
      currentUser: {
        get: () => {
          getAuthResponse: () => {
            id_token: string
            access_token: string
            expires_in: number
          }
        }
      }
    }
  }

  interface ClientSheets {
    spreadsheets: {
      values: {
        append: (options: {
          spreadsheetId: string
          range: string
          valueInputOption: string
          resource: {
            values: any[][]
          }
        }) => Promise<any>
      }
    }
  }

  interface Client {
    init: (options: {
      apiKey: string
      clientId: string
      discoveryDocs: string[]
      scope: string
    }) => Promise<void>
    load: (api: string, version: string) => Promise<void>
    sheets: ClientSheets
  }

  let client: Client

  function load(libraries: string, callback: () => void): void
}

// Window型の拡張
declare global {
  interface Window {
    gapi: typeof gapi
  }
}

export {}
