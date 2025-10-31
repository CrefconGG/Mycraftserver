const API_BASE = "https://0n63psw8x9.execute-api.us-east-1.amazonaws.com/test1/";
let isLoading = false;
let loadingWorldId = null;
let loadingAction = null;
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

  const anyRunning = data.some(w => w.status === "running");
  const anyLoading = loadingWorldId !== null;

  data.forEach(world => {
    const div = document.createElement("div");
    div.className = "world-card";

    const isLoading = loadingWorldId === world.worldId;

    const launchText = isLoading && loadingAction === 'launch' ? 'Launching...' : 'Launch';
    const stopText   = isLoading && loadingAction === 'stop'   ? 'Stopping...'  : 'Stop';
    const launchSpinner = isLoading && loadingAction === 'launch' ? '<span class="spinner"></span>' : '';
    const stopSpinner   = isLoading && loadingAction === 'stop'   ? '<span class="spinner"></span>' : '';

    // Disable logic
    const disableLaunch = world.status === 'running' || anyRunning || anyLoading;
    const disableStop   = world.status === 'stopped' || anyLoading;
    const disableOther  = anyLoading;

    
    const statusColor = world.status.toLowerCase().trim() === 'running' ? 'status-green' : 'status-red';

    div.innerHTML = `
      <div class="world-header">
        <span class="world-name">${world.displayName}</span>
        <span class="status ${statusColor}">${world.status}</span>
      </div>
      <div class="world-info">Last modified: ${new Date(world.lastModified).toLocaleString()}</div>
      <div class="world-buttons">
        <button class="btn green" onclick="launchWorld('${world.s3Key}', '${world.worldId}')" ${disableLaunch ? 'disabled' : ''}>
          ${launchText} ${launchSpinner}
        </button>
        <button class="btn red" onclick="stopWorld('${world.worldId}')" ${disableStop ? 'disabled' : ''}>
          ${stopText} ${stopSpinner}
        </button>
        <button class="btn blue" onclick="editWorldPrompt('${world.worldId}', '${world.displayName}')" ${disableOther ? 'disabled' : ''}>
          Edit
        </button>
        <button class="btn orange" onclick="deleteWorld('${world.worldId}', '${world.displayName}')" ${disableOther ? 'disabled' : ''}>
          Delete
        </button>
      </div>
    `;

    container.appendChild(div);
  });
}



//start world
async function launchWorld(s3Key, worldId) {
  if (loadingWorldId) return;
  loadingWorldId = worldId;
  loadingAction = 'launch';
  listWorlds();
  await fetch(`${API_BASE}worlds/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ s3Key }),
  });
  alert(`Launching ${s3Key}`);
  loadingWorldId = null;
  loadingAction = null;
  listWorlds();
}

//stop world
async function stopWorld(worldId) {
  if (loadingWorldId) return;
  loadingWorldId = worldId;
  loadingAction = 'stop';
  listWorlds();
  await fetch(`${API_BASE}worlds/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worldId }),
  });
  alert(`Stopping ${worldId}`);
  
  loadingWorldId = null;
  loadingAction = null;
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
      worldId,
      displayName: newName
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

function copyServerIp() {
  const ipSpan = document.querySelector("#server-ip-panel .ip");
  const ipText = ipSpan.textContent;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ipText)
      .then(() => {
        alert(`Copied IP: ${ipText}`);
      })
      .catch(err => {
        console.error("Failed to copy IP:", err);
      });
  } else {
    // Fallback
    const tempInput = document.createElement("input");
    tempInput.value = ipText;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand("copy");
      alert(`Copied IP: ${ipText}`);
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
    document.body.removeChild(tempInput);
  }
}

listWorlds();