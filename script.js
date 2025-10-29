const API_BASE = "https://0n63psw8x9.execute-api.us-east-1.amazonaws.com/test1";

async function uploadWorld() {
  const fileInput = document.getElementById("worldFile");
  const nameInput = document.getElementById("worldName");
  if (!fileInput.files[0] || !nameInput.value) {
    alert("Please select a file and enter a name");
    return;
  }

  const file = fileInput.files[0];
  const worldName = nameInput.value;

  // Get presigned URL
  const presignRes = await fetch(`${API_BASE}/worlds/upload`, {
    method: "POST",
    body: JSON.stringify({ filename: `${worldName}.zip` }),
  });
  const { uploadUrl, s3Key } = await presignRes.json();

  // Upload to S3 directly
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/zip" },
    body: file,
  });

  //  Save metadata in DynamoDB
  await fetch(`${API_BASE}/create-world`, {
    method: "POST",
    body: JSON.stringify({ worldName, s3Key }),
  });

  alert("World uploaded successfully!");
  listWorlds();
}
//show all worlds
async function listWorlds() {
  const res = await fetch(`${API_BASE}/worlds`, {method: "GET"});
  const data = await res.json();
  const container = document.getElementById("worldList");
  container.innerHTML = "";

  data.forEach(world => {
    const div = document.createElement("div");
    div.className = "world-card";
    div.innerHTML = `
      <span><b>${world.worldName}</b> - ${world.status}</span>
      <div>
        <button onclick="launchWorld('${world.worldName}')">Launch</button>
        <button onclick="stopWorld('${world.worldName}')">Stop</button>
        <button onclick="editWorldPrompt('${world.worldName}')">Edit</button>
      </div>
    `;
    container.appendChild(div);
  });
}
//start world
async function launchWorld(worldName) {
  await fetch(`${API_BASE}/worlds/launch`, {
    method: "POST",
    body: JSON.stringify({ worldName }),
  });
  alert(`Launching ${worldName}`);
  listWorlds();
}
//stop world
async function stopWorld(worldName) {
  await fetch(`${API_BASE}/worlds/stop`, {
    method: "POST",
    body: JSON.stringify({ worldName }),
  });
  alert(`Stopping ${worldName}`);
  listWorlds();
}
//edit world name
async function editWorldPrompt(oldName) {
  const newName = prompt(`Rename world "${oldName}" to:`);
  if (!newName) return;

  await fetch(`${API_BASE}/worlds/edit`, {
    method: "PUT",
    body: JSON.stringify({ oldName, newName }),
  });

  alert(`Renamed ${oldName} to ${newName}`);
  listWorlds();
}

listWorlds();
