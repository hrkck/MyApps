import LinkApp from "./views/Apps/LinkApp.svelte";
import FrameWindow from "./views/Apps/FrameWindow.svelte";
import DateApp from "./views/Apps/DateApp.svelte";
import TextEditor from "./views/Apps/TextEditor.svelte";
import ReferenceBoard from "./views/Apps/ReferenceBoard.svelte";
import TodoApp from "./views/Apps/TodoApp.svelte";

// Applications:
export const applications = [
  // { id: 1, title: "Text App", name: 'Hello World', content: 'Hello, World!'},
  {
    id: 1,
    title: "Frame Window",
    name: "Frame",
    content: FrameWindow,
  },
  {
    id: 2,
    title: "Clock App",
    name: "Current Time",
    content: DateApp,
  },
  {
    id: 3,
    title: "Text Editor App",
    name: "Text Editor",
    content: TextEditor,
  },
  {
    id: 4,
    title: "Reference Board",
    name: "Image Reference App",
    content: ReferenceBoard,
  },
  {
    id: 5,
    title: "To Do List",
    name: "To Do App",
    content: TodoApp,
  },
  {
    id: 6,
    title: "Link App",
    name: "Link App",
    content: LinkApp,
  },

  // ... add other applications
];

const linkAppWidth = 80;
const linkAppHeight = 80;
const LinkAppData = {
  id: 6,
  content: LinkApp,
  title: "Link App",
  name: "Link App",
  x: 0,
  y: 0,
  width: linkAppWidth,
  height: linkAppHeight,
};

export const applicationGroups = [
  {
    id: 1,
    groupTitle: "Startup Links",
    groupName: "Startup Links",
    contents: [
      {
        ...LinkAppData,
        windowIconUrl: "https://google.com",
      },
      {
        ...LinkAppData,
        windowIconUrl: "https://web.telegram.org",
      },
      {
        ...LinkAppData,
        windowIconUrl: "https://web.whatsapp.com",
      },
      {
        ...LinkAppData,
        windowIconUrl: "https://youtube.com",
      },
      {
        ...LinkAppData,
        windowIconUrl: "https://translate.google.com",
      },
      {
        ...LinkAppData,
        windowIconUrl: "https://earth.google.com",
      },
      {
        ...LinkAppData,
        windowIconUrl: "https://blender.org",
      },
      {
        ...LinkAppData,
        windowIconUrl: "https://chat.openai.com",
      },
    ],
  },
];
