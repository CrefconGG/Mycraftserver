const API_BASE = "https://0n63psw8x9.execute-api.us-east-1.amazonaws.com/test1/";

async function uploadWorld() {
  const fileInput = document.getElementById("worldFile");
  const nameInput = document.getElementById("worldName");
  if (!fileInput.files[0] || !nameInput.value) {
    alert("Please select a file and enter a name");
    return;
  }

  const file = fileInput.files[0];
  const worldName = nameInput.value;

  // 1. Get presigned URL
  const presignRes = await fetch(`${API_BASE}worlds/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!presignRes.ok) {
     alert("Failed to get upload URL.");
     return;
  }

  const { uploadUrl, key: s3Key, worldId } = await presignRes.json();
  const displayName = worldName;

  // 2. Upload file to S3
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/zip" },
    body: file,
  });

  if (!uploadRes.ok) {
    alert("Upload failed.");
    return;
  }

  // 3. Create world entry in DynamoDB
  const createRes = await fetch(`${API_BASE}worlds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      worldId,
      s3Key,
      displayName,
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
  const res = await fetch(`${API_BASE}worlds`, { method: "GET" });
  const data = await res.json();
  const container = document.getElementById("worldList");
  container.innerHTML = "";

  data.forEach(world => {
    const div = document.createElement("div");
    div.className = "world-card";

    const lastModified = new Date(world.lastModified || world.timestamp || Date.now())
      .toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    const statusClass = {
      starting: "status-yellow",
      running: "status-green",
      stopped: "status-gray",
      error: "status-red"
    }[world.status?.toLowerCase()] || "status-gray";

    div.innerHTML = `
      <div class="world-header">
        <span class="world-name"><b>${world.displayName}</b></span>
        <span class="status ${statusClass}">${world.status || "Unknown"}</span>
      </div>
      <div class="world-info">
        <small>Created: ${lastModified}</small>
      </div>
      <div class="world-buttons">
        <button class="btn blue" onclick="launchWorld('${world.s3Key}')">Launch</button>
        <button class="btn orange" onclick="stopWorld('${world.worldId}')">Stop</button>
        <button class="btn green" onclick="editWorldPrompt('${world.worldId}', '${world.displayName}')">Edit</button>
        <button class="btn red" onclick="deleteWorldPrompt('${world.worldId}', '${world.displayName}')">Delete</button>
      </div>
    `;
    container.appendChild(div);
  });
}


//start world
async function launchWorld(s3Key) {
  await fetch(`${API_BASE}worlds/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ s3Key }), // ส่ง s3Key แทน worldId
  });
  alert(`Launching ${s3Key}`);
  listWorlds();
}

//stop world
async function stopWorld(worldId) {
  await fetch(`${API_BASE}worlds/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worldId }),
  });
  alert(`Stopping ${worldId}`);
  listWorlds();
}

//edit world name
async function editWorldPrompt(worldId, displayName) {
  const newName = prompt(`Rename world "${displayName}" to:`);
  if (!newName) return;

  const res = await fetch(`${API_BASE}worlds/edit`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      worldId,       // ใช้ worldId เป็นตัวอ้างอิงที่ไม่ซ้ำ
      displayName: newName  // เปลี่ยนชื่อที่แสดงผลใน DynamoDB
    }),
  });

  if (!res.ok) {
    alert("Failed to rename world.");
    return;
  }

  alert(`Renamed "${displayName}" to "${newName}"`);
  listWorlds();
}

async function deleteWorld(worldId, displayName) {
  if (!confirm(`Are you sure you want to delete "${displayName}"?`)) return;

  const res = await fetch(`${API_BASE}worlds/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worldId }),
  });

  if (res.ok) {
    alert(`Deleted "${displayName}"`);
    listWorlds();
  } else {
    const err = await res.text();
    alert(`Failed to delete: ${err}`);
  }
}
listWorlds();