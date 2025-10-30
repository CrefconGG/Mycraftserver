const API_BASE = "https://0n63psw8x9.execute-api.us-east-1.amazonaws.com/test1/";

async function uploadWorld() {
  const fileInput = document.getElementById("worldFile");
  const nameInput = document.getElementById("worldName");
  if (!fileInput.files[0] || !nameInput.value) {
    alert("Please select a file and enter a name");
    return;
  }

  const file = fileInput.files[0];
  const worldName = nameInput.value; // ชื่อที่แสดงผล
  

  // Get presigned URL
  const presignRes = await fetch(`${API_BASE}worlds/upload`, {
    method: "POST",
    // ส่งชื่อไฟล์ (worldId) ไปให้ presignUpload
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  
  
  if (!presignRes.ok) {
     alert("Failed to get upload URL.");
     return;
  }
  
  const { uploadUrl, key: s3Key } = await presignRes.json(); // presignUpload.js ส่ง 'key' ไม่ใช่ 's3Key'

  // Upload to S3 directly
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/zip" },
    body: file,
  });

  if (!uploadUrl.ok) {
    alert("Upload failed.");
    return;
  }

  // 🔹 4. สร้าง world entry ใน DynamoDB
  const createRes = await fetch(`${API_BASE}worlds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      worldId,      // ใช้ worldId ที่ได้จาก presignUpload
      s3Key,        // ใช้ key ที่ presign ให้มา เช่น worlds/world-xxxx.zip
      displayName,  // ชื่อโลกที่ผู้ใช้กรอก
    }),
  });

  if (!createRes.ok) {
    alert("Failed to save world info to database.");
    return;
  }

  const createdWorld = await createRes.json();

  alert(`World "${createdWorld.displayName}" uploaded successfully!`);
  listWorlds();
}
//show all worlds
async function listWorlds() {
  const res = await fetch(`${API_BASE}worlds`, {method: "GET"});
  const data = await res.json();
  const container = document.getElementById("worldList");
  container.innerHTML = "";

  data.forEach(world => {
    const div = document.createElement("div");
    div.className = "world-card";
    div.innerHTML = `
      <span><b>${world.displayName}</b> - ${world.status}</span>
      <div>
        <button onclick="launchWorld('${world.displayName}')">Launch</button>
        <button onclick="stopWorld('${world.displayName}')">Stop</button>
        <button onclick="editWorldPrompt('${world.displayName}')">Edit</button>
      </div>
    `;
    container.appendChild(div);
  });
}
//start world
async function launchWorld(worldName) {
  await fetch(`${API_BASE}worlds/launch`, {
    method: "POST",
    body: JSON.stringify({ worldName }),
  });
  alert(`Launching ${worldName}`);
  listWorlds();
}
//stop world
async function stopWorld(worldName) {
  await fetch(`${API_BASE}worlds/stop`, {
    method: "POST",
    body: JSON.stringify({ worldName }),
  });
  alert(`Stopping ${worldName}`);
  listWorlds();
}
//edit world name
async function editWorldPrompt(displayName) {
  const newName = prompt(`Rename world "${displayName}" to:`);
  if (!newName) return;

  await fetch(`${API_BASE}worlds/edit`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName, newName }),
  });

  alert(`Renamed ${displayName} to ${newName}`);
  listWorlds();
}

listWorlds();
