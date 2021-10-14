// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: sun;
// Uposatha Widget - https://vpnry.github.io/upcal
// Last modified: 2021-01-20

const gitURL = "https://vpnry.github.io/upcal/Upcal_Module.js";
const widgetName = "Upcal_Widget.js";
const moduleName = "Upcal_Module.js";
const jsonParsePoint = "u@pc@l";

let fm = FileManager.local();
const is_iCloud = fm.isFileStoredIniCloud(module.filename);
fm = is_iCloud ? FileManager.iCloud() : fm;

let filename = fm.fileName(module.filename, true);
if (filename != widgetName) {
  let newPath = fm.joinPath(fm.documentsDirectory(), widgetName);
  let str = fm.readString(module.filename);
  fm.writeString(newPath, str.trim());
  fm.remove(module.filename);
}
let modulePath = fm.joinPath(fm.documentsDirectory(), moduleName);
if (!fm.fileExists(modulePath)) {
  console.log(moduleName + " is not exist. Trying to download it from git.");
  let str = "";
  try {
    let r = new Request(gitURL);
    str = await r.loadString();
  } catch (e) {
    console.log("Error when trying to download module file:\n" + gitURL + "\n" + e);
    return;
  }
  if (str.indexOf(jsonParsePoint) > 0) {
    fm.writeString(modulePath, str);
  } else {
    console.log("Incompatible " + moduleName + " file. Check!");
    return;
  }
}
// Must await & invoke app.init(fm) first
let app = await importModule(modulePath);
await app.init(fm);
if (config.runsInWidget) {
  let widget = await app.createUpCalWidget();
  Script.setWidget(widget);
} else {
  console.log(app.settings);
  await app.selectTask();
}

Script.complete();
