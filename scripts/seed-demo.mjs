// Seeds a demo account with realistic folders + files, then prints the JWT.
// Usage: node scripts/seed-demo.mjs   (backend must be up on :8080)
const API = process.env.API_BASE ?? "http://localhost:8080/api";
const USER = {
  email: "demo@cloudbox.app",
  password: "demopassword",
  displayName: "Demo User",
};

async function getToken() {
  // Try register; if the user already exists, log in instead.
  let res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(USER),
  });
  if (!res.ok) {
    res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: USER.email, password: USER.password }),
    });
  }
  if (!res.ok) throw new Error(`auth failed: ${res.status} ${await res.text()}`);
  return (await res.json()).token;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createFolder(token, name, parentId = null) {
  const res = await fetch(`${API}/folders`, {
    method: "POST",
    headers: { ...auth(token), "Content-Type": "application/json" },
    body: JSON.stringify({ name, parentId }),
  });
  if (!res.ok) throw new Error(`folder ${name}: ${res.status} ${await res.text()}`);
  return (await res.json()).id;
}

async function uploadFile(token, name, type, sizeKB, folderId = null) {
  // Generate filler bytes so the size column looks realistic.
  const bytes = new Uint8Array(Math.round(sizeKB * 1024));
  for (let i = 0; i < bytes.length; i++) bytes[i] = i % 251;
  const form = new FormData();
  form.append("file", new Blob([bytes], { type }), name);
  if (folderId != null) form.append("folderId", String(folderId));
  const res = await fetch(`${API}/files`, { method: "POST", headers: auth(token), body: form });
  if (!res.ok) throw new Error(`upload ${name}: ${res.status} ${await res.text()}`);
  return (await res.json()).id;
}

async function star(token, kind, id) {
  await fetch(`${API}/${kind}s/${id}`, {
    method: "PATCH",
    headers: { ...auth(token), "Content-Type": "application/json" },
    body: JSON.stringify({ starred: true }),
  });
}

// Removes existing active items so re-runs don't pile up duplicates.
async function wipe(token) {
  const root = await (await fetch(`${API}/folders`, { headers: auth(token) })).json();
  for (const f of root.folders ?? [])
    await fetch(`${API}/folders/${f.id}`, { method: "DELETE", headers: auth(token) });
  for (const f of root.files ?? [])
    await fetch(`${API}/files/${f.id}`, { method: "DELETE", headers: auth(token) });
  const trash = await (await fetch(`${API}/trash`, { headers: auth(token) })).json();
  for (const f of trash.files ?? [])
    await fetch(`${API}/files/${f.id}/permanent`, { method: "DELETE", headers: auth(token) });
}

const token = await getToken();
await wipe(token);

// Folders (capture their ids so we can nest files)
const documents = await createFolder(token, "Documents");
const photos = await createFolder(token, "Photos");
const work = await createFolder(token, "Work");
await createFolder(token, "Personal");

// Root-level files
const gettingStarted = await uploadFile(token, "Getting Started.pdf", "application/pdf", 320);
await uploadFile(token, "Budget 2026.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 84);
await uploadFile(token, "Notes.txt", "text/plain", 6);

// Documents
await uploadFile(token, "Resume.pdf", "application/pdf", 210, documents);
await uploadFile(token, "Cover Letter.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 48, documents);
await uploadFile(token, "Contract.pdf", "application/pdf", 540, documents);

// Photos
await uploadFile(token, "Sunset.png", "image/png", 1200, photos);
await uploadFile(token, "Beach.jpg", "image/jpeg", 980, photos);
await uploadFile(token, "Mountains.jpg", "image/jpeg", 1500, photos);

// Work
await uploadFile(token, "Q1 Report.pdf", "application/pdf", 760, work);
await uploadFile(token, "Roadmap.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 120, work);

// A couple of starred items for the "Suggested"/Starred views
await star(token, "folder", documents);
await star(token, "file", gettingStarted);

console.log(token);
