<script>
  import { onDestroy } from "svelte";
  import { gun } from "../../scripts/initGun";
  import { cleanGunData } from "../../scripts/utils";
    import { SvelteSet } from "svelte/reactivity";

  let { uniqueID } = $props();
  let count = $state(0);

  function increment() {
    count += 1;
  }

  // ########################################
  let currentTime = $state(0);
  let lastUpdateTime = $state(Date.now());
  let responseTime = $state(0);
  let peerList = new SvelteSet();
  let peerCount = $state(0);

  // Function to update the time
  function updateTime() {
    lastUpdateTime = Date.now();;
    gun.get("currenttime").put({ time: lastUpdateTime });
  }

  // Initial time push
  updateTime();

  // Subscribe to changes
  gun.get("currenttime").on((data, key, msg, ev) => {
    const now = Date.now();
    if (data?.time && data.time !== currentTime) {
      responseTime = now - data.time;
      currentTime = data.time;

      // Try to identify peer from msg
      if (msg?.headers?.via) {
        peerList.add(msg.headers.via);
      } else if (msg?.via) {
        peerList.add(msg.via);
      } else if (msg?.soul) {
        peerList.add(msg.soul); // Fallback
      }

      peerCount = peerList.size;
    }
  });


  let note = gun.get("myappnotes").get("textarea");
  let text = $state("");
  note.on((data) => {
    text = cleanGunData(data);
  });
</script>

<div class="example-app">
  <p>uniqueID: {uniqueID}</p>
  <p>count: {count}</p>
  <input type="button" value="increment" onclick={increment} />
  <br />
  <br />
  <p>Time: {currentTime}</p>

  <hr/>

  <div>
    <h2 >🕒 Current Time Sync</h2>

    <p>Last synced time: {new Date(currentTime).toLocaleTimeString()}</p>
    <p>⏱ Peer response time: {responseTime} ms</p>
    <p>🌍 Peers count: {peerCount}</p>

    <ul>
      {#each Array.from(peerList) as peer}
        <li>{peer}</li>
      {/each}
    </ul>

    <button onclick={updateTime}>
      Update Time
    </button>

    <hr />

    <textarea name="" id="" bind:value={text} oninput={(value) => note.put(text)}></textarea>
  </div>
</div>

<style>
  .example-app {
    width: 100%;
    height: 100%;
    align-content: center;
    text-align: center;
  }
  p {
    margin: 0;
    padding: 0;
    line-height: 1.5;
    align-items: center;
  }
</style>
