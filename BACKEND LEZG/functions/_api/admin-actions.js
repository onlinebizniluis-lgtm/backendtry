import { createRemoteJWKSet, jwtVerify, importPKCS8, SignJWT } from 'jose';

// --- 1. HELPER: GET GOOGLE ACCESS TOKEN ---
// This uses your Private Key to "Login" to Google servers from Cloudflare
async function getGoogleAuthToken(env) {
  try {
    const serviceAccountEmail = env.FIREBASE_CLIENT_EMAIL;
    // Fix key formatting (replace literal \n with actual newlines)
    const privateKeyString = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    // Import the private key
    const privateKey = await importPKCS8(privateKeyString, 'RS256');

    // Create a JWT for Google OAuth
    const jwt = await new SignJWT({
      scope: 'https://www.googleapis.com/auth/datastore'
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(serviceAccountEmail)
      .setSubject(serviceAccountEmail)
      .setAudience('https://oauth2.googleapis.com/token')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    // Exchange JWT for Access Token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const data = await response.json();
    return data.access_token;
  } catch (e) {
    throw new Error("Failed to authenticate with Google: " + e.message);
  }
}

// --- 2. MAIN HANDLER ---
export async function onRequestPost({ request, env }) {
  try {
    // A. VERIFY THE USER (Must be You)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return new Response("Missing Token", { status: 401 });
    const idToken = authHeader.split(" ")[1];

    // Verify token matches Firebase
    const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    });

    // CHANGE THIS TO YOUR EMAIL
    const ADMIN_EMAIL = "luisdhaenielv@gmail.com"; 

    if (payload.email !== ADMIN_EMAIL) {
      return new Response("ACCESS DENIED: NOT ADMIN", { status: 403 });
    }

    // B. PROCESS THE REQUEST
    const body = await request.json();
    const { targetUid, plan } = body;

    if (!targetUid) return new Response("Missing targetUid", { status: 400 });

    // C. UPDATE FIRESTORE (Using the Access Token)
    const accessToken = await getGoogleAuthToken(env);
    
    const projectId = env.FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${targetUid}?updateMask.fieldPaths=status&updateMask.fieldPaths=plan&updateMask.fieldPaths=approvedAt`;

    const firestoreResponse = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          status: { stringValue: "approved" },
          plan: { stringValue: plan || "pro" }, // Default to pro
          approvedAt: { timestampValue: new Date().toISOString() }
        }
      })
    });

    if (!firestoreResponse.ok) {
      const errText = await firestoreResponse.text();
      return new Response("Database Error: " + errText, { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: "User Approved!" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response("Server Error: " + err.message, { status: 500 });
  }
}