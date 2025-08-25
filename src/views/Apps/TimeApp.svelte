<!-- TimeApp.svelte -->
<script>
  // @ts-nocheck

  import { onDestroy, onMount, tick } from "svelte";
  import { contentProperties, windowStores } from "../../scripts/storage";
  import { writable } from "svelte/store";
  import { user } from "../../scripts/initGun";
  import { cleanGunData } from "../../scripts/utils";
  import DraggableResizableScalable from "../DraggableResizableScalableComponent/DraggableResizableScalable.svelte";

  let { uniqueID } = $props();
  const mainAppStore = $windowStores[uniqueID];

  const timerData = writable($mainAppStore.timerData || {});
  let liveTime = writable(0);

  let running = $state(false);
  let startTime = $state(0);
  let liveInterval;

  // access nested value with $derived if you want a reactive local value
  let isActive = $derived($mainAppStore.isActive);

  // react to changes
  $effect(() => {
    if (isActive) {
      // do something
    } else {
      closePopup();
    }
  });
  function startTimer() {
    if (!running) {
      running = true;
      startTime = Date.now();

      localStorage.setItem(`timeApp-${uniqueID}`, JSON.stringify({ running, startTime }));

      liveInterval = setInterval(() => {
        liveTime.set(Date.now() - startTime);
      }, 100);
    }
  }

  function stopTimer() {
    if (running) {
      running = false;
      clearInterval(liveInterval);
      localStorage.removeItem(`timeApp-${uniqueID}`); // clear persisted timer

      const endTime = Date.now();
      const now = new Date();
      const dateKey = now.toISOString().split("T")[0];
      const entryID = `${dateKey}-${endTime}`; // unique key
      const newEntry = { start: startTime, end: endTime, label: "", date: dateKey };

      timerData.update((obj) => {
        return { ...obj, [entryID]: newEntry };
      });

      $mainAppStore.timerData = { ...$timerData };

      user.get("windows").get(uniqueID).get("timeAppData").put($mainAppStore.timerData);

      liveTime.set(0);
    }
    console.log($timerData);
  }

  function updateLabel(entryID, value) {
    timerData.update((obj) => {
      if (obj[entryID]) obj[entryID].label = value;
      return { ...obj };
    });

    $mainAppStore.timerData = { ...$timerData };
    user.get("windows").get(uniqueID).get("timeAppData").put($mainAppStore.timerData);
  }

  async function initData() {
    await user
      .get("windows")
      .get(uniqueID)
      .get("timeAppData")
      .map()
      .once((data, key) => {
        if (key != "_" && data) {
          data = cleanGunData(data);
          timerData.update((obj) => {
            return { ...obj, [key]: data };
          });
          $mainAppStore.timerData = { ...$timerData };
        }
      });
  }

  function groupByDate(entriesObj) {
    const grouped = {};
    Object.entries(entriesObj).forEach(([key, e]) => {
      e.id = key; // assign id from GunDB key
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    return grouped;
  }

  // Returns {top, height} relative to the hour box
  function getFilledBoxes(entry, hour) {
    const entryStart = new Date(entry.start);
    const entryEnd = new Date(entry.end);

    const hourStart =
      hour === entryStart.getHours() ? entryStart : new Date(entryStart).setHours(hour, 0, 0, 0);
    const hourEnd =
      hour === entryEnd.getHours() ? entryEnd : new Date(entryStart).setHours(hour + 1, 0, 0, 0);

    const startMinutes = new Date(hourStart).getMinutes();
    const endMinutes = new Date(hourEnd).getMinutes();

    let top = (startMinutes / 60) * 100;
    let height = ((endMinutes - startMinutes) / 60) * 100;

    // Ensure min 8px height relative to hour-box height (80px)
    const minPercent = (8 / 80) * 100;
    height = Math.max(height, minPercent);

    return { top, height };
  }

  //   POPUP
  let popupOpen = $state(false);
  let popupEntry = $state({
    id: "no-id-yet-for-popup",
  });
  let popupPosition = $state({ top: 0, left: 0 });

  let popupColor = $state("#4caf50");

  const Popupstore = writable({
    uniqueID: "timeapp-poup",
    boxShadow: true,
    hideOverflow: true,
    dragEventTarget: "node",
    useWindow: false,
    scalable: false,
    resizable: false,
    keepRatio: false,
    showGrabbers: true,
    hideHeaderResize: false,
    isActiveDraggable: false,
    scale: 1,
    isActive: false,
    selected: false,
    zIndex: 201,
    x: 0,
    y: 0,
    width: 200,
    height: 300,
    contentScale: 1,
  });

  function openPopup(entry, event) {
    popupEntry = entry;
    popupOpen = true;

    // Initialize popupColor
    popupColor = popupEntry.color || "#4caf50";

    const rect = event.currentTarget.getBoundingClientRect();
    // event.currentTarget.id = popupEntry.id;
    const containerRect = document
      .getElementById($mainAppStore.uniqueID + "-timeApp")
      .getBoundingClientRect();

    const scale = $contentProperties?.scale || 1;

    popupPosition = {
      top: (rect.bottom - containerRect.top + 5) / scale,
      left: (rect.left - containerRect.left) / scale,
    };

    Popupstore.update((data) => {
      data.y = popupPosition.top;
      data.x = popupPosition.left;
      data.isActiveDraggable = popupOpen;
      data.contentScale = $contentProperties.scale;
      return data;
    });
  }

  function handleColorChange(e) {
    popupColor = e.target.value;
    updatePopupColor(popupColor);
  }

  function closePopup() {
    popupOpen = false;
    popupEntry = null;
  }

  function updatePopupDescription(value) {
    if (!popupEntry) return;
    const updatedEntry = { ...popupEntry, description: value };

    timerData.update((obj) => ({
      ...obj,
      [updatedEntry.id]: updatedEntry,
    }));

    const newTimerData = { ...$timerData, [updatedEntry.id]: updatedEntry };
    $mainAppStore.timerData = newTimerData;
    user.get("windows").get(uniqueID).get("timeAppData").put(newTimerData);

    popupEntry = updatedEntry;
  }

  function updatePopupLabel(value) {
    if (!popupEntry) return;

    const updatedEntry = { ...popupEntry, label: value };

    timerData.update((obj) => {
      return {
        ...obj,
        [updatedEntry.id]: updatedEntry,
      };
    });

    const newTimerData = { ...$timerData, [updatedEntry.id]: updatedEntry };
    $mainAppStore.timerData = newTimerData;
    user.get("windows").get(uniqueID).get("timeAppData").put(newTimerData);

    popupEntry = updatedEntry; // reassign at the end
  }

  function updatePopupColor(value) {
    if (!popupEntry) return;

    const updatedEntry = { ...popupEntry, color: value };

    timerData.update((obj) => {
      return {
        ...obj,
        [updatedEntry.id]: updatedEntry,
      };
    });

    // ensure sync with store and GunDB
    const newTimerData = { ...$timerData, [updatedEntry.id]: updatedEntry };
    $mainAppStore.timerData = newTimerData;
    user.get("windows").get(uniqueID).get("timeAppData").put(newTimerData);

    popupEntry = updatedEntry; // reassign at the end, safe non-reactive
  }

  // close popup on outside click
  function handleClickOutside(event) {
    if (popupOpen && !event.target.closest(".popup")) {
      // closePopup();
    }
  }

  function formatElapsed(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    if (totalSeconds < 60) {
      return `${totalSeconds} s`;
    }
    const totalMinutes = Math.floor(totalSeconds / 60);
    if (totalMinutes < 60) {
      // blinking colon effect
      const seconds = totalSeconds % 60;
      const colon = Math.floor(Date.now() / 1000) % 2 ? ":" : " ";
      return `${totalMinutes}${colon}${seconds.toString().padStart(2, "0")}`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  function calculateStats(entries) {
    const total = entries.reduce((sum, e) => sum + (e.end - e.start), 0);
    const count = entries.length;
    const avg = count ? total / count : 0;
    return { total, count, avg };
  }

  onMount(() => {
    initData();
    // document.addEventListener("click", handleClickOutside);
  });

  // clean up
  onDestroy(() => {
    // document.removeEventListener("click", handleClickOutside);
  });
</script>

<svelte:window on:click|capture={handleClickOutside} />

<div class="main" id={$mainAppStore.uniqueID + "-timeApp"}>
  <div class="controls">
    <button onclick={startTimer} disabled={running}>Start Timer</button>
    <button onclick={stopTimer} disabled={!running}>Stop Timer</button>
    {#if running}
      <span>Running: {formatElapsed($liveTime)}</span>
    {/if}
  </div>

  <div class="columns">
    {#each Object.entries(groupByDate($timerData)) as [date, entries]}
      <div class="column">
        <h3>{date}</h3>
        <div class="day-grid">
          {#each Array(24) as _, hour}
            <div class="hour-box">
              <span class="hour-number">{hour.toString().padStart(2, "0")}</span>
              {#each entries as entry}
                {#if entry.start <= new Date().setHours(hour + 1, 0, 0, 0) && entry.end >= new Date().setHours(hour, 0, 0, 0)}
                  {#if entry.end - entry.start < 60000}
                    <!-- short session marker -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      class="tiny-marker"
                      style="top:{getFilledBoxes(entry, hour)
                        .top}%; background-color:{entry.color || '#4caf50'}"
                      title="{entry.label || 'Short session'} | {formatElapsed(
                        entry.end - entry.start,
                      )}"
                      onclick={(e) => openPopup({ ...entry, id: entry.id }, e)}
                    ></div>
                  {:else}
                    <!-- normal filled block -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      class="filled"
                      style="
      top:{getFilledBoxes(entry, hour).top}%;
      height:{getFilledBoxes(entry, hour).height}%;
      background-color:{entry.color || '#4caf50'};
    "
                      title="{entry.label || 'Session'} | {formatElapsed(entry.end - entry.start)}"
                      onclick={(e) => openPopup({ ...entry, id: entry.id }, e)}
                    >
                      <span class="label-text">{entry.label}</span>
                    </div>
                  {/if}
                {/if}
              {/each}
            </div>
          {/each}
        </div>
        <div class="day-summary">
          {#await Promise.resolve(calculateStats(entries)) then stats}
            <span>Total: {formatElapsed(stats.total)}</span>
            <span>Sessions: {stats.count}</span>
            <span>Avg: {formatElapsed(stats.avg)}</span>
          {/await}
        </div>

        {#each entries as entry}
          <div class="label-entry">
            <input
              type="text"
              placeholder="Label"
              value={entry.label}
              oninput={(e) => updateLabel(entry.id, e.target.value)}
            />
          </div>
        {/each}
      </div>
    {/each}
  </div>

  {#if popupOpen}
    <DraggableResizableScalable uniqueID={Popupstore.uniqueID} store={Popupstore}>
      <!-- <div class="popup" style="top: {popupPosition.top}px; left: {popupPosition.left}px;"> -->
      <div class="popup">
        <button class="close-btn" onclick={closePopup}>×</button>
        <div class="popup-content">
          <label>
            Label:
            <input
              type="text"
              placeholder="Label"
              value={popupEntry.label}
              oninput={(e) => updatePopupLabel(e.target.value)}
            />
          </label>

          <label>
            Color:
            <input type="color" value={popupColor} oninput={handleColorChange} />
          </label>

          <label>
            Description:
            <textarea
              placeholder="Description"
              value={popupEntry.description}
              oninput={(e) => updatePopupDescription(e.target.value)}
            ></textarea>
          </label>

          <div class="popup-stats">
            <div>Start: {new Date(popupEntry.start).toLocaleTimeString()}</div>
            <div>End: {new Date(popupEntry.end).toLocaleTimeString()}</div>
            <div>Duration: {formatElapsed(popupEntry.end - popupEntry.start)}</div>
          </div>
        </div>
      </div>
    </DraggableResizableScalable>
  {/if}
</div>

<style>
  .tiny-marker {
    width: 100%;
    height: 6px;
    background: repeating-linear-gradient(
      45deg,
      var(--entry-color, #4caf50),
      var(--entry-color, #4caf50) 4px,
      transparent 4px,
      transparent 8px
    );
    border-radius: 2px;
  }

  .label-text {
    display: block;
    width: 100%;
    height: 100%;
    font-size: 12px;
    color: white;
    padding: 2px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    pointer-events: none; /* so click passes to filled div */
  }
  .popup {
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    padding: 8px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    min-width: 180px;
  }

  .popup .close-btn {
    position: absolute;
    top: 2px;
    right: 4px;
    border: none;
    background: none;
    font-size: 16px;
    cursor: pointer;
  }

  .day-summary {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #333;
    margin: 4px 0 10px 0;
    padding: 2px 4px;
    border-top: 1px solid #ddd;
  }

  .popup-content label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    color: #333;
  }

  .popup-content textarea {
    width: 100%;
    min-height: 50px;
    resize: vertical;
  }

  .popup-stats {
    margin-top: 6px;
    font-size: 12px;
    color: #555;
    border-top: 1px solid #eee;
    padding-top: 4px;
  }

  .popup-content input[type="text"] {
    width: 100%;
    margin-bottom: 6px;
  }

  .popup-content input[type="color"] {
    width: 100%;
    height: 30px;
    border: none;
    padding: 0;
  }

  .hour-number {
    position: absolute;
    top: 2px;
    left: 2px;
    font-size: 10px;
    color: #555;
    z-index: 10;
    pointer-events: none;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
  }

  button {
    padding: 6px 12px;
    font-size: 14px;
  }

  .columns {
    display: flex;
    gap: 20px;
    overflow-x: auto;
  }

  .column {
    display: flex;
    flex-direction: column;
    /* min-width: 150px; */
  }

  h3 {
    text-align: center;
    margin-bottom: 5px;
  }

  .day-grid {
    display: grid;
    grid-template-rows: repeat(24, 80px);
    gap: 2px;
    border: 1px solid #ccc;
    margin-bottom: 10px;
  }

  .hour-box {
    position: relative;
    border: 1px solid #eee;
  }

  .filled {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    min-height: 8px;
    background-color: #4caf50;
    cursor: pointer;
  }

  .label-entry input {
    width: 100%;
    padding: 4px;
    margin-bottom: 2px;
  }
</style>
