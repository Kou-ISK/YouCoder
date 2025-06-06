/// <reference types="../types/gapi" />

// Load the Google API client library
export const loadGapi = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://apis.google.com/js/api.js"
    script.onload = () => {
      // gapi は window.gapi として使用できる
      window.gapi.load("client:auth2", async () => {
        try {
          await window.gapi.client.init({
            apiKey: "YOUR_API_KEY", // Replace with your API key
            clientId: "YOUR_CLIENT_ID", // Replace with your client ID
            discoveryDocs: [
              "https://sheets.googleapis.com/$discovery/rest?version=v4"
            ],
            scope: "https://www.googleapis.com/auth/spreadsheets"
          })
          await window.gapi.client.load("sheets", "v4") // Load Sheets API explicitly
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    }
    script.onerror = () => reject(new Error("Failed to load gapi script"))
    document.body.appendChild(script)
  })
}

/**
 * Sign in the user using Google Auth.
 */
export const signIn = async (): Promise<void> => {
  await window.gapi.auth2.getAuthInstance().signIn()
}

/**
 * Sign out the user.
 */
export const signOut = async (): Promise<void> => {
  await window.gapi.auth2.getAuthInstance().signOut()
}

/**
 * Get the authentication URL for Google Sign-In.
 * @returns The authentication URL.
 */
export const getAuthUrl = async (): Promise<string> => {
  await window.gapi.auth2.getAuthInstance().signIn()
  return window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse()
    .id_token
}

/**
 * Set the credentials for Google API access.
 * @param code The authorization code.
 */
export const setCredentials = async (code: string): Promise<void> => {
  const token = window.gapi.auth2
    .getAuthInstance()
    .currentUser.get()
    .getAuthResponse()
  window.gapi.auth.setToken({
    access_token: token.access_token,
    expires_in: token.expires_in.toString(), // Convert number to string
    error: "", // Default empty string for error
    state: "" // Default empty string for state
  })
}

/**
 * Append data to a Google Sheet.
 * @param spreadsheetId The ID of the spreadsheet.
 * @param range The range to append data to (e.g., "Sheet1!A1:E1").
 * @param values The data to append.
 */
export const appendToSheet = async (
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<void> => {
  // window.gapiがロードされていることを確認
  if (!window.gapi || !window.gapi.client || !window.gapi.client.sheets) {
    throw new Error("Google API Client Library has not been loaded properly")
  }

  await window.gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    resource: {
      values
    }
  })
}
