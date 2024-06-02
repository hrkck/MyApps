<!-- Frame.svelte -->
<script>
  import DraggableResizable from "../DraggableResizable.svelte";
  import { user } from "../../scripts/initGun";
  import { contentProperties, windowStores } from "../../scripts/storage";
  import { get } from "svelte/store";
  import {  getAppIDsInAFrame } from "../../scripts/utils";
  import {  beforeUpdate, onMount } from "svelte";

  export let uniqueID;
  const store = windowStores[uniqueID];
  $store.contentScale = $contentProperties.scale;

  const draggableFunctions = {
    dragStartFunc: function (store, event, x, y) {
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
    },
    dragMoveFunc: function (store, event, x, y) {
      let appIDs = getAppIDsInAFrame(uniqueID);
      let appStore;
      for (const appID of appIDs) {
        appStore = windowStores[appID];
        appStore.update((appData) => {
          appData.x += x;
          appData.y += y;
          return appData;
        });
        appStore = appStore // force trigger reactivity (? does it do anything)
      }
    },
    dragEndFunc: function (s, event, x, y) {
      let appIDs = getAppIDsInAFrame(uniqueID);
      let appStore, appX, appY;
      for (const appID of appIDs) {
        appStore = windowStores[appID];
        appX = get(appStore).x;
        appY = get(appStore).y;
        user.get("windows").get(appID).put({ x: appX, y: appY });
      }
      user.get("windows").get(uniqueID).put({ x: x, y: y });
    },
    resizeStartFunc: function (store, event, x, y, width, height) {
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
    },
    resizeMoveFunc: function (store, event, x, y, width, height) {},
    resizeEndFunc: function (store, event, x, y, width, height) {},
    scaleFunc: function (store, event, x, y, scale) {},
  };

  beforeUpdate(() => {
    windowStores[uniqueID] = store;
  });
  onMount(() => {
    user.get("windows").get(uniqueID).get('x').on(data=>{
      $store.x=data
    })
    user.get("windows").get(uniqueID).get('y').on(data=>{
      $store.y=data
    })
  });
</script>

<DraggableResizable {uniqueID} {store} {...draggableFunctions}>
  <div id="{uniqueID}-child" class="frame"></div>
</DraggableResizable>

<style>
  .frame {
    background-color: #0083ff47;
    height: 100%;
    width: 100%;
  }
</style>
