// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: sun;
/*---------------------------------------------------------------------
 * Upcal - https://github.com/vpnry/upcal
 * Description: Uposatha calendar and dawn time widget in Scriptable
 * Initial: 03 Oct 2020
 * Cuong DANG @ 2020 - Upcal is released under the MIT License too
 * --------------------------------------------------------------------
 * File: Upcal_Module.js
 * Last modified: 20 Jan 2021
 * --------------------------------------------------------------------
 * Open source library (MIT) used:
 * MIT License (https://opensource.org/licenses/MIT)
 * SunCalc (Vladimir Agafonkin), MMCal (Yan Naing Aye)
 * Widget and table snippet is based on Coronavirus Scriptable Widget (03 Oct 2020):
 * https://gist.github.com/planecore/e7b4c1e5db2dd28b1a023860e831355e
 *--------------------------------------------------------------------*/

const thisAppVersion = 2;
const thisAppVersionDate = "(2021-01-20)";
const jsonParsePoint = "u@pc@l";
const errorLocation = 9999.99999;
const upcalRepos = "https://vpnry.github.io/upcal";
let p_countGMTDate, countGMTDate;

//--------------------------------------------------------------------
// countGMTDate: count days for an event: ordination date etc..
// trictly follow the example date format & update GMT timezone
//--------------------------------------------------------------------

// uncomment the below code line to overwrite u_monthUposathaTitle
// countGMTDate = new Date("October 10, 2020 20:20:20 GMT+06:30");
if (countGMTDate) {
  let cdays = (Date.now() - countGMTDate) / (24 * 60 * 60 * 1000);
  p_countGMTDate = f3dits(cdays) + " days since v1 birthday";
}

//--------------------------------------------------------------------
// DISPLAY UI STRINGS
//--------------------------------------------------------------------

const u_DateDiv = ".";
const u_WidgetBackgroundColor = "black";
const u_TodayDawnTime = "Today at";
const u_SasanaYear = "Sasana year ";

const u_dayth = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const u_iMonths = ["1-Jan", "2-Feb", "3-Mar", "4-Apr", "5-May", "6-Jun", "7-Jul", "8-Aug", "9-Sep", "10-Oct", "11-Nov", "12-Dec"];
const u_shortMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//const u_shortMonth = createMonthNamesLocale();
const u_monthUposathaTitle = `Myanmar - Uposatha Dates`;

// Do not add "  " double spaces into these vars
const u_FMPatimokkha = "🌕";
const u_NMPatimokkha = "🔵";
const u_WaxingQuarter = "🌓";
const u_WaningQuarter = "🌗";

const adjFontSize = 1;
const fSize12 = newFSize(12, adjFontSize);
const fSize14 = newFSize(14, adjFontSize);
const fSize16 = newFSize(16, adjFontSize);
const fSize18 = newFSize(18, adjFontSize);

let sasanaYearNow = "";

//--------------------------------------------------------------------
// EXPORTS upCAL
//--------------------------------------------------------------------

const upCAL = {
  async init(fm) {
    this.nameFileCode = "Upcal_Module.js";
    this.nameSettingFile = "Upcal_Setting.js";

    this.fm = fm;
    this.gitURL = `https://vpnry.github.io/upcal/` + this.nameFileCode;
    this.pathSetting = this.fm.joinPath(this.fm.documentsDirectory(), this.nameSettingFile);
    this.pathFileCode = this.fm.joinPath(this.fm.documentsDirectory(), this.nameFileCode);
    this.settings = await this.loadSettings(this.pathSetting);
    if (this.settings.upcalVersion != thisAppVersion) {
      this.settings = await this.upgradeSettingObject(this.settings);
    }

    if (this.settings.latitude == errorLocation && !config.runsInWidget) {
      let idix = await this.alertThis("Location Set Up Needed", ["Yes, use GPS 📡", "Yes, fill in location manually 📝"], "Not now", "Dawntime calculation function needs location data like latitude & longitude.\n\nIt appears that you haven't done the location set up properly. \nWould you like to do it now?");
      if (idix == 0) {
        await this.updateLocationGPS();
      } else if (idix == 1) {
        await this.updateLocationManually();
      }
    }
    this.inited = true;
  },

  async selectTask() {
    let acts = ["📅 View A Year Uposatha", "🌅 Download Upcal New Version", "📡 Use GPS Update Location"];
    let idx = await this.alertThis("Choose An Action", acts, "Exit Upcal", "Choose an action");
    if (idx == -1) {
      return;
    }
    if (idx == 0) await this.createWholeYearTable();
    else if (idx == 1) await this.updateApp();
    else if (idx == 2) await this.updateLocationGPS();
  },

  async createUpCalWidget() {
    let cddt = new Date();
    let dawnTodayArray = getDawnTodayArray(this.settings.latitude, this.settings.longitude, this.settings.altitude, this.settings.u_DawnMinus, this.settings.useDynamicDawn_Formula2, this.settings.displayNauticalCivilDawn);

    let uposathaDateArray = getUposathaMonthArray(cddt.getFullYear(), cddt.getMonth(), true);

    let dstr = returnTodayString();
    let widget = createWidget(
      fSize12,
      fSize14,
      fSize16,
      fSize18,
      u_WidgetBackgroundColor,

      `🌅 UPCAL  ${dstr}`,
      this.settings.locationNAME,
      u_TodayDawnTime,
      dawnTodayArray,
      p_countGMTDate || u_monthUposathaTitle,
      uposathaDateArray
    );
    return widget;
  },

  async createWholeYearTable() {
    let cddt = new Date();
    let cDeviceYear = cddt.getFullYear();
    let cDeviceMonth = cddt.getMonth();

    let alex = new Alert();
    alex.title = "VIEW ANY YEAR \nMM UPOSATHA DATES";
    alex.message = "Enter A YEAR Number To List All MM Uposatha Dates.\nFor example next year: " + (cDeviceYear + 1);
    alex.addTextField("yyyy", `${cDeviceYear}`);
    alex.addCancelAction("Cancel");
    alex.addAction("View");

    let idx = await alex.presentAlert();
    if (idx == -1) {
      log("Cancelled");
      return;
    }
    let thisYear = Number(alex.textFieldValue(0));
    if (!isNumber(thisYear)) {
      log("Invalid year input, switch to use the device current year");
      thisYear = currentDeviceYear;
    }

    let table = new UITable();
    table.showSeparators = true;

    let row = new UITableRow();
    row.isHeader = true;
    row.addText(`Myanmar Uposatha Dates in ${thisYear}`, `These calculated dates are for references only.`).centerAligned();
    table.addRow(row);

    // fill data
    // the ending , of Date, is a trict to display the row equally with others
    table.addRow(createHeaderRow("Month", "Date,Date,Date,Date,Date,".split(",")));

    let i = 0;
    for (; i < 12; i++) {
      let rowi = createRow(u_iMonths[i], getUposathaMonthArray(thisYear, i));

      if (i == cDeviceMonth) {
        rowi.backgroundColor = Color.green();
        if (i % 2 == 0) rowi.backgroundColor = Color.blue();
      }

      table.addRow(rowi);
    }

    // add legend
    let legendrow = new UITableRow();
    legendrow.addText("", `\n🌕 full moon | 🔵 new moon | 14/15th: 14/15th day | other: quarter uposatha`).rightAligned();
    table.addRow(legendrow);

    // add credit
    let creditRow = new UITableRow();
    creditRow.addText("", `\n📜 Open source lib: SunCalc (Vladimir Agafonkin), MMCal (Yan Naing Aye) \nThis Upcal version: ${thisAppVersion + " " + thisAppVersionDate}. More info & update: ${upcalRepos}`).rightAligned();
    table.addRow(creditRow);

    if (config.runsWithSiri) {
      Speech.speak(`Uposatha Date in ${thisYear}`);
    }

    if (table) table.present();
    return table;
  },

  async updateLocationGPS() {
    let title = "📡 Use GPS Update Location";
    let msge = `Dawn time calculation needs location info.\n\n1. Turn on Location Service: Setting->Privacy.\n2. Allow location access for Scriptable.\n3. It may take a while to detect your location.\n\n ************************ \nIf an error 'kCLErrorDomain error 0.' occurs: try openning the Maps app (by Apple) and let Maps successfully locate 📍 your location then immediately try this update location process again!`;

    let iid = await this.alertThis(title, ["Yes, I have done these steps ➡️", "📝 Stop, I will fill in location manually"], "Exit, do nothing", msge);
    if (iid == -1) {
      return;
    }
    if (iid == 1) {
      return await this.updateLocationManually();
    }

    let currentSettings = await this.loadSettings(this.pathSettings);
    try {
      let locaObj = await Location.current();

      if (locaObj.latitude) {
        let locationString = JSON.stringify(locaObj);
        let alex = new Alert();
        alex.title = "Location Located Successfully";
        alex.message = "\nCurrent location: \n" + locationString + "\n\nGive a SHORT NAME for this location:\n";
        alex.addTextField("NEW PLACE NAME?", "NEW PLACE NAME?");
        alex.addAction("Update...");
        alex.addCancelAction("Cancel");
        let idx = await alex.presentAlert();
        if (idx == -1) {
          console.log("Cancelled");
          return;
        }

        let locaNameValue = alex.textFieldValue(0);
        locaNameValue = (locaNameValue + "").toUpperCase();
        // Escapse " for later stringify with formart
        locaObj["locationNAME"] = locaNameValue.replace(/"/g, '\\"');

        // locaObj = {
        //   latitude: number,
        //   longitude: number,
        //   altitude: number,
        //   locationNAME: "MY HOUSE NAME?",
        //   horizontalAccuracy: number,
        //   verticalAccuracy: number,
        // }

        for (let k of Object.keys(locaObj)) {
          currentSettings[k] = locaObj[k];
        }

        if (idx > -1) {
          await this.saveSettings(currentSettings);
        }

        await this.alertThis("Successfully Updated New Location", "", "Done", `Location updated for ${locaNameValue} \n\n Welcome to ${locaNameValue}!`);
      }
    } catch (e) {
      await this.alertThis("Location Detection Failed", "", "Exit", `Please try again. Error:\n` + e);
    }
    return;
  },

  async updateApp() {
    let remoteCode;
    let markPoint = "//thisAppVersion=";

    try {
      remoteCode = await this.loadFile(this.gitURL);
    } catch (e) {
      await this.alertThis("Failed to check for update", "", "OK", "Error details:\n\n" + e);
      return false;
    }

    if (!remoteCode) return;

    if (remoteCode.indexOf(markPoint) < 0) {
      await this.alertThis("The module code is invalid", "", "OK", "It appears that you have downloaded a wrong module file.");
      return false;
    }

    remoteCode = remoteCode.trim();
    let remoteVer = remoteCode.substr(remoteCode.lastIndexOf(markPoint) + markPoint.length);
    let localVer = thisAppVersion;

    let idx;
    if (remoteVer != localVer) {
      idx = await this.alertThis("🎉 Upcal new version " + remoteVer + " is available", ["Update new version..."], "No, stop", "A new Upcal version is available. Would you like to update?");
    }

    if (idx > -1 || !this.fm.fileExists(this.pathFileCode)) {
      this.fm.writeString(this.pathFileCode, remoteCode);
      await this.alertThis("Successfully updated", "", "OK", "Please completely close and restart Scriptable");
    }

    if (remoteVer == localVer) {
      await this.alertThis("🎉 You are using the latest version", "", "OK", "You are using the latest version of Upcal.");
    }
  },

  async upgradeSettingObject(oldSettingObj) {
    let newObj = await this.genDefaultSettings(this.pathSetting);
    for (let k of Object.keys(oldSettingObj)) {
      if (k == "upcalVersion" || k == "settingGenerated") continue;
      newObj[k] = oldSettingObj[k];
    }
    await this.saveSettings(newObj);
    console.log("Upgraded setting to version: " + thisAppVersion);
    console.log(newObj);
    return newObj;
  },

  async genDefaultSettings(pathSetting) {
    console.log("Generating default Upcal setting object.");
    let initSettings = {
      u_DawnMinus: 40,
      useDynamicDawn_Formula2: true,
      displayNauticalCivilDawn: false,
      // errorLocation = 9999.99999,
      latitude: errorLocation,
      longitude: errorLocation,
      altitude: 0,
      locationNAME: "Name This PLace?",
      horizontalAccuracy: 0,
      verticalAccuracy: 0,
      upcalVersion: thisAppVersion,
    };
    await this.saveSettings(initSettings);
    return initSettings;
  },

  async saveSettings(sett) {
    let str = `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: sun;
/*------------------------------------------------------------------------
 * ${this.nameSettingFile} - Upcal version: ${thisAppVersion + " " + thisAppVersionDate}
 * -----------------------------------------------------------------------
 * You can manually update your location info & some other things here
 * Do not change any object property (key names)
 
 * In this app, to calculate dawn time, there are currently 2 formulas:
 * Formula 1: Dawn time = Sunrise time - u_DawnMinus (a fixed minute)
 * Formula 2: Dawn time = Sunrise - (Civil dawn - Nautical dawn)

 * u_DawnMinus: Minutes before sunrise, used in formula 1,
 * here we use 40 for Myanmar, you can adjust this value.
 
 * useDynamicDawn_Formula2: true|false. Set true to use formula 2
 * displayNauticalCivilDawn: true|false. Show|hide Nautical & Civil dawn
 
 * altitude: if you don't know, can use 0
 
 * locationNAME: name current location, use a short name like: "TTW3"

 * In case of ERRORS occurrred, simply DELETE this ${this.nameSettingFile} file
 * Upcal will automatically re-generate a new default setting file.
 *-----------------------------------------------------------------------*/
// Do not edit this comment line, it marks a JSON parse point: ${jsonParsePoint}

{
`;
    // JSON.stringify(obj) produces a one line setting string
    // which will be difficult to edit its property manually
    // So here we try to use an alternative way.

    if (typeof sett === "string") {
      let o = JSON.parse(sett);
      for (let k of Object.keys(o)) {
        //if (typeof o[k] === "boolean" || typeof o[k] === "number" ) {
        if (typeof o[k] !== "string") {
          str += `  "${k}": ${o[k]},\n`;
        } else {
          str += `  "${k}": "${o[k]}",\n`;
        }
      }
      str += `  "settingGenerated": "${new Date() + ""}"\n`;
    } else if (typeof sett === "object") {
      let o = sett;
      for (let k of Object.keys(o)) {
        if (typeof o[k] !== "string") {
          str += `  "${k}": ${o[k]},\n`;
        } else {
          str += `  "${k}": "${o[k]}",\n`;
        }
      }
      str += `  "settingGenerated": "${new Date() + ""}"\n`;
    }
    this.fm.writeString(this.pathSetting, str + "}");
    console.log("The setting file is saved");
  },

  async loadSettings(pathSetting) {
    let st;
    if (!pathSetting) pathSetting = this.pathSetting;
    if (this.fm.fileExists(pathSetting)) {
      console.log("Load settings from the setting file");
      let t = this.fm.readString(pathSetting);
      // jsonParsePoint was added to mark a substr point in the comment
      t = t.substr(t.indexOf(jsonParsePoint) + jsonParsePoint.length);
      try {
        st = await JSON.parse(t);
      } catch (e) {
        console.log("Errors when parsing settings from file.\n" + e);
        let idix = await this.alertThis("Your Upcal Setting file has errors", ["Yes"], "No", "Error detail:\n" + e + "\n\nWould you like to reset it to the default value?");
        if (idix > -1) {
          st = await this.genDefaultSettings(pathSetting);
        }
      }
    } else {
      st = await this.genDefaultSettings(pathSetting);
    }
    return st;
  },

  async checkLocationPermission() {
    let havep = true;
    try {
      await Location.current();
      await this.alertThis("Obtain Location Data Successfully", "", "Ok", "Scriptable could access Location Service successfully.");
    } catch (e) {
      havep = false;
      await this.alertThis("Failed To Obtain Location Data", "", "Ok", "Scriptable has no permission to access Location Service. Or errors occurrred. Error:\n" + e);
      console.log(e);
    }
    return havep;
  },

  async updateLocationManually() {
    let idx = await this.alertThis(
      "Modify Location Data & Settings Manually",
      ["📡 Use GPS Update Location"],
      "Exit, do nothing",
      "You can manually fill in location data (like latitude and longitude...)\n\nIn Scriptable, open Upcal_Setting and edit them manually. You can adjust some other settings there too.\n\nFor auto update location data via GPS, use the below menu."
    );
    if (idx > -1) await this.updateLocationGPS();
  },

  async alertThis(title, actions, cancelStr = "", msg = "") {
    let alex = new Alert();
    alex.title = title;
    alex.message = msg;
    if (cancelStr) {
      alex.addCancelAction(cancelStr);
    }
    if (typeof actions == "object") {
      for (let a of actions) {
        alex.addAction(a);
      }
    }
    let idx = await alex.presentAlert();
    if (idx == -1) {
      log("Cancelled");
      return -1;
    }
    return idx;
  },

  async loadFile(gitURL) {
    let str;
    try {
      let r = new Request(gitURL);
      str = await r.loadString();
    } catch (e) {
      let t = "Error when trying to load\n" + gitURL + "\n\n" + e;
      console.log(t);
      throw t;
    }
    if (str) return str;
    else return false;
  },
};

module.exports = upCAL;

//--------------------------------------------------------------------
// HELPER FUNCTIONS AND APP LIBRARIES
// DO NOT RENAME, OR BE MORE CAREFUL WHEN MODIFY THEM
//--------------------------------------------------------------------

function createMonthNamesLocale(locale = "") {
  // Return an array of month names in locale format
  // getval: (0,1,2,3,4,5)  = (weekday,date,month,year,str,array)
  locale = locale || Device.locale();
  if (!locale) locale = "";
  let ob = new Map();
  let i = 0;
  let d = new Date();
  for (; i < 12; i++) {
    d.setMonth(i);
    ob.set(i, localeIt(d, 2, "short", locale));
  }
  return Array.from(ob.values());
}

function localeIt(dateobj, getval, monthformat = "short", locale = "") {
  // Display date time in locale format
  // getval: (0,1,2,3,4,5)  = (weekday,date,month,year,str,array)
  locale = locale || Device.locale();
  if (!locale) locale = "";
  let df = new DateFormatter();
  df.locale = locale;
  df.dateFormat = "EEEE_@_dd_@_MMM_@_yyyy";
  if (monthformat == "long") df.dateFormat = "EEEE_@_dd_@_MMMM_@_yyyy";
  let str = df.string(dateobj);
  str = str.split("_@_");
  if (getval == 4) return str.join(" ");
  if (getval == 5) return str;
  return str[getval];
}

function returnTodayString() {
  let d = new Date();
  let options = { weekday: "long", year: "numeric", month: "short", day: "2-digit" };
  // undefined will use env default (device) locale format
  return d.toLocaleDateString(undefined, options);
}

function returnToday_OldVersion(withDayth = false) {
  let dt = new Date();
  let y = dt.getFullYear();
  let m = u_shortMonth[dt.getMonth()];
  let d = dt.getDate();
  let dstr = f2d(d) + " " + m + " " + y;
  if (withDayth) {
    dstr = u_dayth[dt.getDay()] + ", " + dstr;
  }
  return dstr;
}

function newFSize(fsize, adjustFontValue) {
  if (!isNaN(adjustFontValue)) return Math.floor(fsize * Math.abs(adjustFontValue));
  return Number(fsize);
}

function f3dits(n) {
  // https://riptutorial.com/javascript/topic/3276/data-manipulation
  n = n.toFixed(4).replace(/\d(?=\d{3}\.)/g, "$&,");
  return n.slice(0, -2);
}

function f2d(str) {
  str = "00" + str;
  return str.substring(str.length - 2);
}

function isNumber(n) {
  return !isNaN(n);
}

function createHeaderRow(title, values) {
  let row = new UITableRow();
  row.addText(title).leftAligned();
  for (let v of values) {
    row.addText(v.toString()).centerAligned();
  }
  return row;
}

function createRow(monthstr, values) {
  let row = new UITableRow();
  row.addText(monthstr).leftAligned();

  // To display the table evenly, make all array.length equally
  // Each month may have maximum 6 sabbath days or uposatha days

  let vlen = 6 - values.length;
  while (vlen > 0) {
    values.push(" ");
    vlen = vlen - 1;
  }

  for (let v of values) {
    if (v.includes("th")) {
      let vs = v.split("  ");
      row.addText(vs[1].toString(), vs[0].toString()).centerAligned();
    } else {
      row.addText(v.toString(), " ").centerAligned();
    }
  }
  return row;
}

function createWidget(fSize12, fSize14, fSize16, fSize18, wbgcolor, widgetName, currentLocaName, dawnTitle, dawnArray, upoMonthTitle, upoDateArray) {
  let w = new ListWidget();

  // Color.dynamic(lightmode_Color, darkmode_Color);
  // Hint: use iPad keyboard dark/light mode background color;
  w.backgroundColor = Color.dynamic(new Color("#C0B9AB", 255), new Color("#191919", 127));
  //w.spacing = 1;
  //w.setPadding(top, leading, bottom, trailing)
  let preTxt = w.addText(widgetName);
  preTxt.textColor = Color.dynamic(Color.black(), Color.white());
  preTxt.textOpacity = 0.8;
  preTxt.font = Font.mediumMonospacedSystemFont(fSize14);
  preTxt.leftAlignText();
  w.addSpacer(6);

  let fDawnTitle = w.addText(dawnTitle + " 📍 " + currentLocaName + "");
  fDawnTitle.textColor = Color.dynamic(Color.black(), Color.white());
  fDawnTitle.textOpacity = 0.8;
  fDawnTitle.font = Font.mediumRoundedSystemFont(fSize14);
  fDawnTitle.leftAlignText();
  w.addSpacer(5);

  for (let info of dawnArray) {
    let subDawnVal = w.addText(info);
    subDawnVal.textColor = Color.dynamic(Color.black(), Color.white());
    subDawnVal.textOpacity = 0.9;

    if (info.toLowerCase().includes("dawn") || info.toLowerCase().includes("noon")) {
      subDawnVal.font = Font.boldRoundedSystemFont(fSize18);
      subDawnVal.leftAlignText();
    } else {
      subDawnVal.font = Font.italicSystemFont(fSize16);
      subDawnVal.leftAlignText();
    }
  }
  // w.addSpacer(3);
  let fUpoTitle = w.addText(upoMonthTitle);
  fUpoTitle.textColor = Color.dynamic(Color.black(), Color.white());
  fUpoTitle.textOpacity = 0.9;
  fUpoTitle.font = Font.mediumRoundedSystemFont(fSize14);
  fUpoTitle.rightAlignText();
  w.addSpacer(1);

  let buddhistYear = w.addText(u_SasanaYear + sasanaYearNow);
  buddhistYear.textColor = Color.dynamic(Color.black(), Color.white());
  buddhistYear.textOpacity = 0.7;
  buddhistYear.font = Font.lightRoundedSystemFont(fSize12);
  buddhistYear.rightAlignText();
  w.addSpacer(4);

  for (let i of upoDateArray) {
    w.addSpacer(2);
    let subUpoDateVal = w.addText(i);
    subUpoDateVal.textColor = Color.dynamic(Color.black(), Color.white());
    subUpoDateVal.textOpacity = 0.9;
    if (i.includes("14th") || i.includes("15th")) {
      subUpoDateVal.font = Font.boldRoundedSystemFont(fSize18);
      subUpoDateVal.rightAlignText();
    } else {
      subUpoDateVal.font = Font.italicSystemFont(fSize16);
      subUpoDateVal.rightAlignText();
    }
  }

  return w;
}

function getDawnTodayArray(userlat, userlong, userheight = 0, u_DawnMinus = 40, useDynamicDawn_Formula2 = true, displayNauticalCivilDawn = false) {
  if (userlat == errorLocation || userlong == errorLocation) {
    //return [`No location - Dawn`, `No location - Rise`, `No location - Noon`, `No location - Set`];
    return [`Dawntime calculation`, `needs location data`, `Open Scriptable app`, `-> run Upcal_Widget`];
  }
  const SunCalc = returnSunCalc();
  const times = SunCalc.getTimes(new Date(), userlat, userlong, userheight);

  // const appdawn = f2d(times.dawn.getHours()) + ":" + f2d(times.dawn.getMinutes())

  let sunrise = f2d(times.sunrise.getHours()) + ":" + f2d(times.sunrise.getMinutes());

  // for example 40 minutes in mcsec = 2400000
  const userDawn = new Date(times.sunrise.getTime() - Number(u_DawnMinus) * 60 * 1000);

  let nauticalDawn = times.nauticalDawn.getTime();
  let civilDawn = times.dawn.getTime();
  // Formula 2 dawn time = sunrise - (civil dawn - nautical dawn)
  const formula2_DawnMinus = civilDawn - nauticalDawn;
  const userDawn2 = new Date(times.sunrise.getTime() - Number(formula2_DawnMinus));

  nauticalDawn = new Date(nauticalDawn);
  civilDawn = new Date(civilDawn);

  let userDawnValue = f2d(userDawn.getHours()) + ":" + f2d(userDawn.getMinutes());

  const nauticalValue = f2d(nauticalDawn.getHours()) + ":" + f2d(nauticalDawn.getMinutes());

  const civilValue = f2d(civilDawn.getHours()) + ":" + f2d(civilDawn.getMinutes());

  let userDawnValue2 = f2d(userDawn2.getHours()) + ":" + f2d(userDawn2.getMinutes());

  const solarNoon = f2d(times.solarNoon.getHours()) + ":" + f2d(times.solarNoon.getMinutes());

  const sunset = f2d(times.sunset.getHours()) + ":" + f2d(times.sunset.getMinutes());

  if (useDynamicDawn_Formula2) {
    userDawnValue = userDawnValue2;
  }
  if (displayNauticalCivilDawn) {
    sunrise = `${nauticalValue} Nautical\n${civilValue} Civil\n${sunrise}`;
  }

  return [`${userDawnValue} Dawn` /*`${userDawnValue2} Dawn`,*/, `${sunrise} Rise`, `${solarNoon} Noon`, `${sunset} Set`];
}

/*--------------------------------------------------------------------
 * App Library
 * ------------------------------------------------------------------*/

/*--------------------------------------------------------------------
 * MMCAL Library
 * ------------------------------------------------------------------*/

function getUposathaMonthArray(setthisyear, setthismonth, isWidget = false) {
  /*--------------------------------------------------------------------
   * ceMmDateTime.js, index.htm
   * Modified and deleted un-used classes for UPCAL Scriptable iOS widget
   * Retrieved Date: 2020.10.03
   * ------------------------------------------------------------------*/

  // File: ceMmDateTime.js
  // Description: Modern Myanmar Calendrical Calculations
  //------------------------------------------------------------------------
  // WebSite: https://yan9a.github.io/mcal/
  // MIT License (https://opensource.org/licenses/MIT)
  // Copyright (c) 2018 Yan Naing Aye
  // Doc: http://cool-emerald.blogspot.com/2013/06/algorithm-program-and-calculation-of.html
  //------------------------------------------------------------------------

  /*
MIT License

Copyright (c) 2018 Yan Naing Aye

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

  class ceDateTime {
    constructor(m_jd, m_tz, m_ct = 0, m_SG = 2361222) {
      // 2361222 - Gregorian start in British calendar (1752/Sep/14)
      if (m_tz == undefined) this.m_tz = ceDateTime.ltzoh();
      else this.m_tz = m_tz; // time zone for this particular instance
      if (m_jd == undefined) this.m_jd = ceDateTime.jdnow();
      else this.m_jd = m_jd; // julian date in UTC
      this.m_ct = m_ct; // calendar type [0=British (default), 1=Gregorian, 2=Julian]
      this.m_SG = m_SG; // Beginning of Gregorian calendar in JDN [default=2361222]
    }
    //Start of core functions #############################################################
    //-------------------------------------------------------------------------
    //Julian date to Western date
    //Credit4 Gregorian date: http://pmyers.pcug.org.au/General/JulianDates.htm
    //Credit4 Julian Calendar: http://quasar.as.utexas.edu/BillInfo/JulianDatesG.html
    //input: (jd:julian date,
    // ct:calendar type [Optional argument: 0=British (default), 1=Gregorian, 2=Julian]
    // SG: Beginning of Gregorian calendar in JDN [Optional argument: (default=2361222)])
    //output: Western date (y=year, m=month, d=day, h=hour, n=minute, s=second)
    static j2w(jd, ct = 0, SG = 2361222) {
      // 2361222-Gregorian start in British calendar (1752/Sep/14)
      var j, jf, y, m, d, h, n, s;
      if (ct == 2 || (ct == 0 && jd < SG)) {
        var b, c, f, e;
        j = Math.floor(jd + 0.5);
        jf = jd + 0.5 - j;
        b = j + 1524;
        c = Math.floor((b - 122.1) / 365.25);
        f = Math.floor(365.25 * c);
        e = Math.floor((b - f) / 30.6001);
        m = e > 13 ? e - 13 : e - 1;
        d = b - f - Math.floor(30.6001 * e);
        y = m < 3 ? c - 4715 : c - 4716;
      } else {
        j = Math.floor(jd + 0.5);
        jf = jd + 0.5 - j;
        j -= 1721119;
        y = Math.floor((4 * j - 1) / 146097);
        j = 4 * j - 1 - 146097 * y;
        d = Math.floor(j / 4);
        j = Math.floor((4 * d + 3) / 1461);
        d = 4 * d + 3 - 1461 * j;
        d = Math.floor((d + 4) / 4);
        m = Math.floor((5 * d - 3) / 153);
        d = 5 * d - 3 - 153 * m;
        d = Math.floor((d + 5) / 5);
        y = 100 * y + j;
        if (m < 10) {
          m += 3;
        } else {
          m -= 9;
          y = y + 1;
        }
      }
      jf *= 24;
      h = Math.floor(jf);
      jf = (jf - h) * 60;
      n = Math.floor(jf);
      s = (jf - n) * 60;
      return { y: y, m: m, d: d, h: h, n: n, s: s };
    }
    //-------------------------------------------------------------------------
    //Time to Fraction of day starting from 12 noon
    //input: (h=hour, n=minute, s=second) output: (d: fraction of day)
    static t2d(h, n, s) {
      return (h - 12) / 24 + n / 1440 + s / 86400;
    }
    //-------------------------------------------------------------------------
    //Western date to Julian date
    //Credit4 Gregorian2JD: http://www.cs.utsa.edu/~cs1063/projects/Spring2011/Project1/jdn-explanation.html
    //input: (y: year, m: month, d: day, h=hour, n=minute, s=second,
    // ct:calendar type [Optional argument: 0=British (default), 1=Gregorian, 2=Julian]
    // SG: Beginning of Gregorian calendar in JDN [Optional argument: (default=2361222)])
    //output: Julian date
    static w2j(y, m, d, h = 12, n = 0, s = 0, ct = 0, SG = 2361222) {
      // 2361222-Gregorian start in British calendar (1752/Sep/14)
      var a = Math.floor((14 - m) / 12);
      y = y + 4800 - a;
      m = m + 12 * a - 3;
      var jd = d + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4);
      if (ct == 1) jd = jd - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
      else if (ct == 2) jd = jd - 32083;
      else {
        jd = jd - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        if (jd < SG) {
          jd = d + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
          if (jd > SG) jd = SG;
        }
      }
      return jd + ceDateTime.t2d(h, n, s);
    }
    //-------------------------------------------------------------------------
    // convert unix timestamp to jd
    static u2j(ut) {
      //number of seconds from 1970 Jan 1 00:00:00 (UTC)
      var jd = 2440587.5 + ut / 86400.0; //converte to day(/24h/60min/60sec) and to JD
      return jd;
    }
    //-------------------------------------------------------------------------
    // julian date to unix time
    static j2u(jd) {
      return (jd - 2440587.5) * 86400.0 + 0.5;
    }
    //-------------------------------------------------------------------------
    // get current time in julian date
    static jdnow() {
      var dt = new Date();
      // the number of milliseconds since 1 January 1970 00:00:00 / 1000
      var ut = dt.getTime() / 1000.0;
      return ceDateTime.u2j(ut);
    }
    //-------------------------------------------------------------------------
    // get local time zone offset between local time and UTC in days
    static ltzoh() {
      var dt = new Date();
      // the difference, in minutes, between UTC and local time
      var tz = dt.getTimezoneOffset() / 60.0;
      return -tz; // between local time and UTC
    }
    //-------------------------------------------------------------------------
    // jd to date time string
    // input: (jd:julian date,
    //  fs: format string [Optional argument: "%Www %y-%mm-%dd %HH:%nn:%ss %zz"]
    //  tz : time zone offset in hours (e.g. 8 for GMT +8)
    //  ct:calendar type [Optional argument: 0=British (default), 1=Gregorian, 2=Julian]
    //  SG: Beginning of Gregorian calendar in JDN [Optional argument: (default=2361222)])
    // output: date time string according to fm where formatting strings are as follows
    // %yyyy : year [0000-9999, e.g. 2018]
    // %yy : year [00-99 e.g. 18]
    // %y : year [0-9999, e.g. 201]
    // %MMM : month [e.g. JAN]
    // %Mmm : month [e.g. Jan]
    // %mm : month with zero padding [01-12]
    // %M : month [e.g. January]
    // %m : month [1-12]
    // %dd : day with zero padding [01-31]
    // %d : day [1-31]
    // %HH : hour [00-23]
    // %hh : hour [01-12]
    // %H : hour [0-23]
    // %h : hour [1-12]
    // %AA : AM or PM
    // %aa : am or pm
    // %nn : minute with zero padding [00-59]
    // %n : minute [0-59]
    // %ss : second [00-59]
    // %s : second [0-59]
    // %lll : millisecond [000-999]
    // %l : millisecond [0-999]
    // %WWW : Weekday [e.g. SAT]
    // %Www : Weekday [e.g. Sat]
    // %W : Weekday [e.g. Saturday]
    // %w : Weekday number [0=sat, 1=sun, ..., 6=fri]
    // %zz : time zone (e.g. +08, +06:30)
    static j2s(jd, fs = "%Www %y-%mm-%dd %HH:%nn:%ss %zz", tz = 0, ct = 0, SG = 2361222) {
      jd += tz / 24.0;
      var dt = ceDateTime.j2w(jd, ct, SG);
      var s = Math.floor(dt.s); //shold not take round to make sure s<60
      var l = Math.floor((dt.s - s) * 1000); // not rounding
      var jdn = Math.floor(jd + 0.5);
      var wd = (jdn + 2) % 7; //week day [0=sat, 1=sun, ..., 6=fri]
      var h = dt.h % 12;
      if (h == 0) h = 12;
      var W = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      var M = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      // replace format string with values
      var fm = fs;
      var fstr, rstr, re;
      //--------------------------------------------------------
      fstr = "%yyyy";
      re = new RegExp(fstr, "g");
      rstr = "0000" + dt.y.toString();
      rstr = rstr.substr(rstr.length - 4);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%yy";
      var y = dt.y % 100;
      re = new RegExp(fstr, "g");
      rstr = "00" + y.toString();
      rstr = rstr.substr(rstr.length - 2);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%y";
      re = new RegExp(fstr, "g");
      rstr = dt.y.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%MMM";
      re = new RegExp(fstr, "g");
      rstr = M[dt.m - 1];
      rstr = rstr.substr(0, 3);
      rstr = rstr.toUpperCase();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%Mmm";
      re = new RegExp(fstr, "g");
      rstr = M[dt.m - 1];
      rstr = rstr.substr(0, 3);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%mm";
      re = new RegExp(fstr, "g");
      rstr = "00" + dt.m.toString();
      rstr = rstr.substr(rstr.length - 2);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%M";
      re = new RegExp(fstr, "g");
      rstr = M[dt.m - 1];
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%m";
      re = new RegExp(fstr, "g");
      rstr = dt.m.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%dd";
      re = new RegExp(fstr, "g");
      rstr = "00" + dt.d.toString();
      rstr = rstr.substr(rstr.length - 2);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%d";
      re = new RegExp(fstr, "g");
      rstr = dt.d.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%HH";
      re = new RegExp(fstr, "g");
      rstr = "00" + dt.h.toString();
      rstr = rstr.substr(rstr.length - 2);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%H";
      re = new RegExp(fstr, "g");
      rstr = dt.h.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%hh";
      re = new RegExp(fstr, "g");
      rstr = "00" + h.toString();
      rstr = rstr.substr(rstr.length - 2);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%h";
      re = new RegExp(fstr, "g");
      rstr = h.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%AA";
      re = new RegExp(fstr, "g");
      rstr = dt.h < 12 ? "AM" : "PM";
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%aa";
      re = new RegExp(fstr, "g");
      rstr = dt.h < 12 ? "am" : "pm";
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%nn";
      re = new RegExp(fstr, "g");
      rstr = "00" + dt.n.toString();
      rstr = rstr.substr(rstr.length - 2);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%n";
      re = new RegExp(fstr, "g");
      rstr = dt.n.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%ss";
      re = new RegExp(fstr, "g");
      rstr = "00" + s.toString();
      rstr = rstr.substr(rstr.length - 2);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%s";
      re = new RegExp(fstr, "g");
      rstr = s.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%lll";
      re = new RegExp(fstr, "g");
      rstr = "000" + l.toString();
      rstr = rstr.substr(rstr.length - 3);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%l";
      re = new RegExp(fstr, "g");
      rstr = l.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%WWW";
      re = new RegExp(fstr, "g");
      rstr = W[wd];
      rstr = rstr.substr(0, 3);
      rstr = rstr.toUpperCase();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%Www";
      re = new RegExp(fstr, "g");
      rstr = W[wd];
      rstr = rstr.substr(0, 3);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%W";
      re = new RegExp(fstr, "g");
      rstr = W[wd];
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%w";
      re = new RegExp(fstr, "g");
      rstr = wd.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "%zz";
      re = new RegExp(fstr, "g");
      var tzs = tz < 0 ? "-" : "+";
      var tzi = Math.floor(tz);
      var tzh = "00" + tzi.toString();
      tzh = tzh.substr(tzh.length - 2);
      rstr = tzs + tzh;
      var tzf = tz - tzi;
      if (tzf > 0) {
        tzh = "00" + Math.floor(tzf * 60.0 + 0.5).toString();
        tzh = tzh.substr(tzh.length - 2);
        rstr += ":" + tzh;
      }
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      return fm;
    }
    //-------------------------------------------------------------------------
    // convert date time string to jd
    // inputs
    //  tstr : time string
    //    accepts following formats
    //    1: yyyy-mm-dd hh:nn:ss
    //    2: yyyy-mm-dd hh:nn:ss.ttt
    //    3: yyyymmddhhnnss
    //    4: yyyymmddhhnnssttt
    //    5: yyyy-mm-dd (default time is 12:00:00)
    //    6: yyyymmdd (default time is 12:00:00)
    //  tz : time zone offset in hours
    //   [optional argument: 0 - UTC]
    //  ct:calendar type [Optional argument: 0=British (default), 1=Gregorian, 2=Julian]
    //  SG: Beginning of Gregorian calendar in JDN [Optional argument: (default=2361222)])
    // output
    //  jd: julian date
    //    positive integer: ok
    //    -1 : error
    static s2j(tstr, tz = 0, ct = 0, SG = 2361222) {
      var str, pstr;
      var y = 0,
        m = 0,
        d = 0,
        h = 12,
        n = 0,
        s = 0,
        ls = 0;
      var jd = -1;
      str = ceDateTime.GetDigits(tstr);
      if (str.length == 8 || str.length == 14 || str.length == 17) {
        pstr = str.substr(0, 4);
        y = parseInt(pstr); //get year
        pstr = str.substr(4, 2);
        m = parseInt(pstr); //get month
        pstr = str.substr(6, 2);
        d = parseInt(pstr); //get day
        if (str.length == 14 || str.length == 17) {
          pstr = str.substr(8, 2);
          h = parseInt(pstr); //get hour
          pstr = str.substr(10, 2);
          n = parseInt(pstr); //get minute
          pstr = str.substr(12, 2);
          s = parseInt(pstr); //get second
          if (str.length == 17) {
            pstr = str.substr(14, 3);
            ls = parseInt(pstr);
            s += ls / 1000.0;
          }
        }
        jd = ceDateTime.w2j(y, m, d, h, n, s, ct, SG) - tz / 24.0; // convert to UTC
      }
      return jd;
    }
    //-------------------------------------------------------------------------
    // set time zone in hours for this instance
    SetTimezone(
      tz //set time zone
    ) {
      if (tz == undefined) {
        this.m_tz = ceDateTime.ltzoh();
      } else if (tz <= 14 || tz >= -12) {
        this.m_tz = tz;
      }
    }
    //-------------------------------------------------------------------------
    // set time to now
    Set2Now() {
      this.m_jd = ceDateTime.jdnow();
    }
    //-------------------------------------------------------------------------
    // set time in jd
    SetJD(jd) {
      this.m_jd = jd;
    }
    //-------------------------------------------------------------------------
    // set in unix time
    SetUnixTime(ut) {
      this.m_jd = ceDateTime.u2j(ut);
    }
    //-------------------------------------------------------------------------
    // set date time for a timezone and a calendar type
    // timezone and calendar type won't be affected (tz and ct remain unchanged)
    SetDateTime(year, month, day, hour = 12, minute = 0, second = 0, tz = 0, ct = 0, SG = 2361222) {
      this.m_jd = ceDateTime.w2j(year, month, day, hour, minute, second, ct, SG) - tz / 24.0;
    }
    //-------------------------------------------------------------------------
    // set time using a date time string
    // inputs
    //  tstr : time string
    //    accepts following formats
    //    1: yyyy-mm-dd hh:nn:ss
    //    2: yyyy-mm-dd hh:nn:ss.ttt
    //    3: yyyymmddhhnnss
    //    4: yyyymmddhhnnssttt
    //  tz : time zone offset in hours
    //   [optional argument: 0 - UTC]
    //  ct:calendar type [Optional argument: 0=British (default), 1=Gregorian, 2=Julian]
    //  SG: Beginning of Gregorian calendar in JDN [Optional argument: (default=2361222)])
    SetDateTimeString(tstr, tz = 0, ct = 0, SG = 2361222) {
      var jd = ceDateTime.s2j(tstr, tz, ct, SG);
      if (jd >= 0) this.m_jd = jd;
    }
    //-------------------------------------------------------------------------
    // set calendar type [0=British (default), 1=Gregorian, 2=Julian]
    SetCT(ct) {
      ct = Math.round(ct % 3);
      this.m_ct = ct;
    }
    //-------------------------------------------------------------------------
    // set Beginning of Gregorian calendar in JDN [default=2361222]
    SetSG(sg) {
      sg = Math.round(sg);
      this.m_SG = sg;
    }
    //-------------------------------------------------------------------------
    // Get Date Time string
    // input: (fs: format string [Optional argument: "%Www %y-%mm-%dd %HH:%nn:%ss %zz"])
    // output: date time string according to fm where formatting strings are as follows
    // %yyyy : year [0000-9999, e.g. 2018]
    // %yy : year [00-99 e.g. 18]
    // %y : year [0-9999, e.g. 201]
    // %MMM : month [e.g. JAN]
    // %Mmm : month [e.g. Jan]
    // %mm : month with zero padding [01-12]
    // %M : month [e.g. January]
    // %m : month [1-12]
    // %dd : day with zero padding [01-31]
    // %d : day [1-31]
    // %HH : hour [00-23]
    // %hh : hour [01-12]
    // %H : hour [0-23]
    // %h : hour [1-12]
    // %AA : AM or PM
    // %aa : am or pm
    // %nn : minute with zero padding [00-59]
    // %n : minute [0-59]
    // %ss : second [00-59]
    // %s : second [0-59]
    // %lll : millisecond [000-999]
    // %l : millisecond [0-999]
    // %WWW : Weekday [e.g. SAT]
    // %Www : Weekday [e.g. Sat]
    // %W : Weekday [e.g. Saturday]
    // %w : Weekday number [0=sat, 1=sun, ..., 6=fri]
    // %zz : time zone (e.g. +08, +06:30)
    ToString(fs = "%Www %y-%mm-%dd %HH:%nn:%ss %zz") {
      return ceDateTime.j2s(this.m_jd, fs, this.m_tz, this.m_ct, this.m_SG);
    }
    //-------------------------------------------------------------------------
    // filter input string to get digits only
    static GetDigits(str) {
      var ostr = "";
      var len = str.length;
      var i = 0;
      if (len > 0) {
        for (i = 0; i < len; i++) if (str[i] >= "0" && str[i] <= "9") ostr += str[i];
      }
      return ostr;
    }
    //-------------------------------------------------------------------------
    // get properties
    get jd() {
      return this.m_jd;
    } // julian date
    get jdl() {
      return this.m_jd + this.m_tz / 24.0;
    } // julian date for this time zone
    get jdn() {
      return Math.round(this.m_jd);
    } // julian date number
    get jdnl() {
      return Math.round(this.m_jd + this.m_tz / 24.0);
    } // julian date number for this time zone
    get y() {
      var dt = ceDateTime.j2w(this.jdl, this.m_ct, this.m_SG);
      return dt.y;
    } // year

    get m() {
      var dt = ceDateTime.j2w(this.jdl, this.m_ct, this.m_SG);
      return dt.m;
    } // month

    get d() {
      var dt = ceDateTime.j2w(this.jdl, this.m_ct, this.m_SG);
      return dt.d;
    } // day

    get h() {
      var dt = ceDateTime.j2w(this.jdl, this.m_ct, this.m_SG);
      return dt.h;
    } // hour [0-23]

    get n() {
      var dt = ceDateTime.j2w(this.jdl, this.m_ct, this.m_SG);
      return dt.n;
    } // minute

    get s() {
      var dt = ceDateTime.j2w(this.jdl, this.m_ct, this.m_SG);
      var s = Math.floor(dt.s); //shold not take round to make sure s<60
      return s;
    } // second

    get l() {
      var dt = ceDateTime.j2w(this.jdl, this.m_ct, this.m_SG);
      var s = Math.floor(dt.s); //shold not take round to make sure s<60
      var l = Math.floor((dt.s - s) * 1000); // not rounding
      return l;
    } // millisecond

    get w() {
      return (this.jdnl + 2) % 7;
    } // weekday [0=sat, 1=sun, ..., 6=fri]
    get ut() {
      return ceDateTime.j2u(this.m_jd);
    } // unix time
    get tz() {
      return this.m_tz;
    } // time zone
    get ct() {
      return this.m_ct;
    } // calendar type
    get SG() {
      return this.m_SG;
    } // Beginning of Gregorian calendar in JDN [default=2361222]
    get mlen() {
      return ceDateTime.wml(this.y, this.m, this.m_ct, this.m_SG);
    } // length of this month
    //----------------------------------------------------------------------------
    // find the length of western month
    // input: (y=year, m=month [Jan=1, ... , Dec=12],
    //  ct:calendar type [Optional argument: 0=British (default), 1=Gregorian, 2=Julian])
    //  SG: Beginning of Gregorian calendar in JDN [Optional argument: (default=2361222)])
    // output: (wml = length of the month)
    static wml(y, m, ct = 0, SG = 2361222) {
      var j1, j2;
      var m2 = m + 1;
      var y2 = y;
      if (m2 > 12) {
        y2++;
        m2 %= 12;
      }
      j1 = ceDateTime.w2j(y, m, 1, 12, 0, 0, ct, SG);
      j2 = ceDateTime.w2j(y2, m2, 1, 12, 0, 0, ct, SG);
      return j2 - j1;
    }
    //-------------------------------------------------------------------------
  }

  class ceMmDateTime extends ceDateTime {
    //-------------------------------------------------------------------------
    constructor(m_jd, m_tz, m_ct = 0, m_SG = 2361222) {
      super(m_jd, m_tz, m_ct, m_SG);
    }
    //-------------------------------------------------------------------------
    // Get Myanmar year constants depending on era
    // Thanks to Myo Zarny and Wunna Ko for earlier Myanmar years data
    // input: my = myanmar year
    // output:
    //  EI = Myanmar calendar era id [1-3] : calculations methods/constants depends on era
    //  WO = watat offset to compensate
    //  NM = number of months to find excess days
    //  EW = exception in watat year
    static GetMyConst(my) {
      var EI,
        WO,
        NM,
        EW = 0,
        i;
      var fme, wte;
      // The third era (the era after Independence 1312 ME and after)
      if (my >= 1312) {
        EI = 3;
        WO = -0.5;
        NM = 8;
        fme = [[1377, 1]];
        wte = [1344, 1345];
      }
      // The second era (the era under British colony: 1217 ME - 1311 ME)
      else if (my >= 1217) {
        EI = 2;
        WO = -1;
        NM = 4;
        fme = [
          [1234, 1],
          [1261, -1],
        ];
        wte = [1263, 1264];
      }
      // The first era (the era of Myanmar kings: ME1216 and before)
      // Thandeikta (ME 1100 - 1216)
      else if (my >= 1100) {
        EI = 1.3;
        WO = -0.85;
        NM = -1;
        fme = [
          [1120, 1],
          [1126, -1],
          [1150, 1],
          [1172, -1],
          [1207, 1],
        ];
        wte = [1201, 1202];
      }
      // Makaranta system 2 (ME 798 - 1099)
      else if (my >= 798) {
        EI = 1.2;
        WO = -1.1;
        NM = -1;
        fme = [
          [813, -1],
          [849, -1],
          [851, -1],
          [854, -1],
          [927, -1],
          [933, -1],
          [936, -1],
          [938, -1],
          [949, -1],
          [952, -1],
          [963, -1],
          [968, -1],
          [1039, -1],
        ];
        wte = [];
      }
      // Makaranta system 1 (ME 0 - 797)
      else {
        EI = 1.1;
        WO = -1.1;
        NM = -1;
        fme = [
          [205, 1],
          [246, 1],
          [471, 1],
          [572, -1],
          [651, 1],
          [653, 2],
          [656, 1],
          [672, 1],
          [729, 1],
          [767, -1],
        ];
        wte = [];
      }
      i = ceMmDateTime.bSearch2(my, fme);
      if (i >= 0) WO += fme[i][1]; // full moon day offset exceptions
      i = ceMmDateTime.bSearch1(my, wte);
      if (i >= 0) EW = 1; //correct watat exceptions

      return { EI: EI, WO: WO, NM: NM, EW: EW };
    }
    //----------------------------------------------------------------------------
    // Search first dimension in a 2D array
    // input: (k=key,A=array)
    // output: (i=index)
    static bSearch2(k, A) {
      var i = 0;
      var l = 0;
      var u = A.length - 1;
      while (u >= l) {
        i = Math.floor((l + u) / 2);
        if (A[i][0] > k) u = i - 1;
        else if (A[i][0] < k) l = i + 1;
        else return i;
      }
      return -1;
    }
    //-----------------------------------------------------------------------------
    // Search a 1D array
    // input: (k=key,A=array)
    // output: (i=index)
    static bSearch1(k, A) {
      var i = 0;
      var l = 0;
      var u = A.length - 1;
      while (u >= l) {
        i = Math.floor((l + u) / 2);
        if (A[i] > k) u = i - 1;
        else if (A[i] < k) l = i + 1;
        else return i;
      }
      return -1;
    }
    //-------------------------------------------------------------------------
    // Check watat (intercalary month)
    // input: (my = myanmar year)
    // output:  ( watat = intercalary month [1=watat, 0=common]
    //  fm = full moon day of 2nd Waso in jdn_mm (jdn+6.5 for MMT) [only valid when watat=1])
    // dependency: GetMyConst(my)
    static cal_watat(my) {
      //get data for respective era
      var SY = 1577917828.0 / 4320000.0; //solar year (365.2587565)
      var LM = 1577917828.0 / 53433336.0; //lunar month (29.53058795)
      var MO = 1954168.050623; //beginning of 0 ME for MMT
      var c = ceMmDateTime.GetMyConst(my); // get constants for the corresponding calendar era
      var TA = (SY / 12 - LM) * (12 - c.NM); //threshold to adjust
      var ed = (SY * (my + 3739)) % LM; // excess day
      if (ed < TA) ed += LM; //adjust excess days
      var fm = Math.round(SY * my + MO - ed + 4.5 * LM + c.WO); //full moon day of 2nd Waso
      var TW = 0,
        watat = 0; //find watat
      if (c.EI >= 2) {
        //if 2nd era or later find watat based on excess days
        TW = LM - (SY / 12 - LM) * c.NM;
        if (ed >= TW) watat = 1;
      } else {
        //if 1st era,find watat by 19 years metonic cycle
        //Myanmar year is divided by 19 and there is intercalary month
        //if the remainder is 2,5,7,10,13,15,18
        //https://github.com/kanasimi/CeJS/blob/master/data/date/calendar.js#L2330
        watat = (my * 7 + 2) % 19;
        if (watat < 0) watat += 19;
        watat = Math.floor(watat / 12);
      }
      watat ^= c.EW; //correct watat exceptions
      return { fm: fm, watat: watat };
    }
    //-------------------------------------------------------------------------
    // Check Myanmar Year
    // input: (my -myanmar year)
    // output:  (myt =year type [0=common, 1=little watat, 2=big watat],
    // tg1 = the 1st day of Tagu as jdn_mm (Julian Day Number for MMT)
    // fm = full moon day of [2nd] Waso as Julain Day Number
    // werr= watat discrepancy [0=ok, 1= error] )
    // dependency: cal_watat(my)
    static cal_my(my) {
      var yd = 0,
        y1,
        nd = 0,
        werr = 0,
        fm = 0;
      var y2 = ceMmDateTime.cal_watat(my);
      var myt = y2.watat;
      do {
        yd++;
        y1 = ceMmDateTime.cal_watat(my - yd);
      } while (y1.watat == 0 && yd < 3);
      if (myt) {
        nd = (y2.fm - y1.fm) % 354;
        myt = Math.floor(nd / 31) + 1;
        fm = y2.fm;
        if (nd != 30 && nd != 31) {
          werr = 1;
        }
      } else fm = y1.fm + 354 * yd;
      var tg1 = y1.fm + 354 * yd - 102;
      return { myt: myt, tg1: tg1, fm: fm, werr: werr };
    }
    //-------------------------------------------------------------------------
    // Julian day number to Myanmar date
    // input: (jdn -julian day number)
    // output:  (
    // myt =year type [0=common, 1=little watat, 2=big watat],
    // my = year,
    // mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //   Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //   Tabaung=12, Late Tagu=13, Late Kason=14 ],
    // md = day of the month [1 to 30])
    // dependency: cal_my(my)
    static j2m(jdn) {
      jdn = Math.round(jdn); //convert jdn to integer
      var SY = 1577917828.0 / 4320000.0; //solar year (365.2587565)
      var MO = 1954168.050623; //beginning of 0 ME
      var my, yo, dd, myl, mmt, a, b, c, e, f, mm, md;
      my = Math.floor((jdn - 0.5 - MO) / SY); //Myanmar year
      yo = ceMmDateTime.cal_my(my); //check year
      dd = jdn - yo.tg1 + 1; //day count
      b = Math.floor(yo.myt / 2);
      c = Math.floor(1 / (yo.myt + 1)); //big wa and common yr
      myl = 354 + (1 - c) * 30 + b; //year length
      mmt = Math.floor((dd - 1) / myl); //month type: late =1 or early = 0
      dd -= mmt * myl;
      a = Math.floor((dd + 423) / 512); //adjust day count and threshold
      mm = Math.floor((dd - b * a + c * a * 30 + 29.26) / 29.544); //month
      e = Math.floor((mm + 12) / 16);
      f = Math.floor((mm + 11) / 16);
      md = dd - Math.floor(29.544 * mm - 29.26) - b * e + c * f * 30; //day
      mm += f * 3 - e * 4 + 12 * mmt; // adjust month numbers for late months
      return { myt: yo.myt, my: my, mm: mm, md: md };
    }
    //-------------------------------------------------------------------------
    // Get moon phase from day of the month, month, and year type.
    // input: (
    //    md= day of the month [1-30],
    //    mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //         Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //         Tabaung=12, Late Tagu=13, Late Kason=14 ],
    //    myt = year type [0=common, 1=little watat, 2=big watat])
    // output: (mp =moon phase [0=waxing, 1=full moon, 2=waning, 3=new moon])
    static cal_mp(md, mm, myt) {
      var mml = ceMmDateTime.cal_mml(mm, myt);
      return Math.floor((md + 1) / 16) + Math.floor(md / 16) + Math.floor(md / mml);
    }
    //-------------------------------------------------------------------------
    // Get length of month from month, and year type.
    // input: (
    //    mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //         Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //         Tabaung=12, Late Tagu=13, Late Kason=14 ],
    //    myt = year type [0=common, 1=little watat, 2=big watat])
    // output: (mml = length of the month [29 or 30 days])
    static cal_mml(mm, myt) {
      var mml = 30 - (mm % 2); //month length
      if (mm == 3) mml += Math.floor(myt / 2); //adjust if Nayon in big watat
      return mml;
    }
    //-------------------------------------------------------------------------
    // Get the apparent length of the year from year type.
    // input: ( myt = year type [0=common, 1=little watat, 2=big watat])
    // output: ( myl= year length [354, 384, or 385 days])
    static cal_myl(myt) {
      return 354 + (1 - Math.floor(1 / (myt + 1))) * 30 + Math.floor(myt / 2);
    }
    //-------------------------------------------------------------------------
    // Get fortnight day from month day
    // input: ( md= day of the month [1-30])
    // output: (mf= fortnight day [1 to 15])
    static cal_mf(md) {
      return md - 15 * Math.floor(md / 16);
    }
    //-------------------------------------------------------------------------
    // Get day of month from fortnight day, moon phase, and length of the month
    // input: (
    //   mf = fortnight day [1 to 15],
    //   mp = moon phase [0=waxing, 1=full moon, 2=waning, 3=new moon]
    //   mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //        Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //        Tabaung=12, Late Tagu=13, Late Kason=14 ],
    //   myt = year type [0=common, 1=little watat, 2=big watat])
    // output: ( md = day of the month [1-30])
    static cal_md(mf, mp, mm, myt) {
      var mml = ceMmDateTime.cal_mml(mm, myt);
      var m1 = mp % 2;
      var m2 = Math.floor(mp / 2);
      return m1 * (15 + m2 * (mml - 15)) + (1 - m1) * (mf + 15 * m2);
    }
    //-------------------------------------------------------------------------
    // Myanmar date to Julian day number
    // input:  (
    //  my = year,
    //  mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //    Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //    Tabaung=12 , Late Tagu=13, Late Kason=14 ],
    //  md = day of the month [1-30]
    // output: (jd -julian day number)
    // dependency: cal_my(my)
    static m2j(my, mm, md) {
      var b, c, dd, myl, mmt;
      var yo = ceMmDateTime.cal_my(my); //check year
      mmt = Math.floor(mm / 13);
      mm = (mm % 13) + mmt; // to 1-12 with month type
      b = Math.floor(yo.myt / 2);
      c = 1 - Math.floor((yo.myt + 1) / 2); //if big watat and common year
      mm += 4 - Math.floor((mm + 15) / 16) * 4 + Math.floor((mm + 12) / 16); //adjust month
      dd = md + Math.floor(29.544 * mm - 29.26) - c * Math.floor((mm + 11) / 16) * 30 + b * Math.floor((mm + 12) / 16);
      myl = 354 + (1 - c) * 30 + b;
      dd += mmt * myl; //adjust day count with year length
      return dd + yo.tg1 - 1;
    }
    //-------------------------------------------------------------------------
    // set Myanmar date time for a timezone and a calendar type
    // timezone and calendar type won't be affected (tz and ct remain unchanged)
    // input:  (
    //  my = year,
    //  mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //    Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //    Tabaung=12 , Late Tagu=13, Late Kason=14 ],
    //  md = day of the month [1-30]
    // ... )
    SetMDateTime(my, mm, md, hour = 12, minute = 0, second = 0, tz = 0) {
      this.m_jd = ceMmDateTime.m2j(my, mm, md) + ceDateTime.t2d(hour, minute, second) - tz / 24.0;
    }
    //-------------------------------------------------------------------------
    //Checking Astrological days
    // More details @ http://cool-emerald.blogspot.sg/2013/12/myanmar-astrological-calendar-days.html
    //-------------------------------------------------------------------------
    // Get sabbath day and sabbath eve from day of the month, month, and year type.
    // input: (
    //    md= day of the month [1-30],
    //    mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //         Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //         Tabaung=12, Late Tagu=13, Late Kason=14 ],
    //    myt = year type [0=common, 1=little watat, 2=big watat])
    // output: ( [1=sabbath, 2=sabbath eve, 0=else])
    static cal_sabbath(md, mm, myt) {
      var mml = ceMmDateTime.cal_mml(mm, myt);
      var s = 0;
      if (md == 8 || md == 15 || md == 23 || md == mml) s = 1;
      if (md == 7 || md == 14 || md == 22 || md == mml - 1) s = 2;
      return s;
    }
    //-------------------------------------------------------------------------
    // Get yatyaza from month, and weekday
    // input: (
    //    mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //         Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //         Tabaung=12, Late Tagu=13, Late Kason=14 ],
    //    wd= weekday  [0=sat, 1=sun, ..., 6=fri])
    // output: ( [1=yatyaza, 0=else])
    static cal_yatyaza(mm, wd) {
      //first waso is considered waso
      var m1 = mm % 4;
      var yatyaza = 0;
      var wd1 = Math.floor(m1 / 2) + 4;
      var wd2 = (1 - Math.floor(m1 / 2) + (m1 % 2)) * (1 + 2 * (m1 % 2));
      if (wd == wd1 || wd == wd2) yatyaza = 1;
      return yatyaza;
    }
    //-------------------------------------------------------------------------
    // Get pyathada from month, and weekday
    // input: (
    //    mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //         Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //         Tabaung=12, Late Tagu=13, Late Kason=14 ],
    //    wd= weekday  [0=sat, 1=sun, ..., 6=fri])
    // output: ( [1=pyathada, 2=afternoon pyathada, 0=else])
    static cal_pyathada(mm, wd) {
      //first waso is considered waso
      var m1 = mm % 4;
      var pyathada = 0;
      var wda = [1, 3, 3, 0, 2, 1, 2];
      if (m1 == 0 && wd == 4) pyathada = 2; //afternoon pyathada
      if (m1 == wda[wd]) pyathada = 1;
      return pyathada;
    }
    //-------------------------------------------------------------------------
    // nagahle
    // input: (
    //    mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //         Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //         Tabaung=12, Late Tagu=13, Late Kason=14 ])
    // output: ( [0=west, 1=north, 2=east, 3=south])
    static cal_nagahle(mm) {
      if (mm <= 0) mm = 4; //first waso is considered waso
      return Math.floor((mm % 12) / 3);
    }
    //-------------------------------------------------------------------------
    // mahabote
    // input: (
    //  my = year,
    //  wd= weekday  [0=sat, 1=sun, ..., 6=fri])
    // output: ( [0=Binga, 1=Atun, 2=Yaza, 3=Adipati, 4= Marana, 5=Thike, 6=Puti])
    static cal_mahabote(my, wd) {
      return (my - wd) % 7;
    }
    //-------------------------------------------------------------------------
    // nakhat
    // input: ( my = year )
    // output: ( [0=Ogre, 1=Elf, 2=Human] )
    static cal_nakhat(my) {
      return my % 3;
    }
    //-------------------------------------------------------------------------
    // thamanyo
    // input: (
    //    mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //         Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //         Tabaung=12, Late Tagu=13, Late Kason=14 ],
    //    wd= weekday  [0=sat, 1=sun, ..., 6=fri])
    // output: ( [1=thamanyo, 0=else])
    static cal_thamanyo(mm, wd) {
      var mmt = Math.floor(mm / 13);
      mm = (mm % 13) + mmt; // to 1-12 with month type
      if (mm <= 0) mm = 4; //first waso is considered waso (looks no need here)
      var thamanyo = 0;
      var m1 = mm - 1 - Math.floor(mm / 9);
      var wd1 = (m1 * 2 - Math.floor(m1 / 8)) % 7;
      var wd2 = (wd + 7 - wd1) % 7;
      if (wd2 <= 1) thamanyo = 1;
      return thamanyo;
    }
    //-------------------------------------------------------------------------
    // Get amyeittasote
    // input: (
    //    md= day of the month [1-30],
    //    wd= weekday  [0=sat, 1=sun, ..., 6=fri])
    // output: ( [1=amyeittasote, 0=else])
    static cal_amyeittasote(md, wd) {
      var mf = md - 15 * Math.floor(md / 16); //get fortnight day [0-15]
      var amyeittasote = 0;
      var wda = [5, 8, 3, 7, 2, 4, 1];
      if (mf == wda[wd]) amyeittasote = 1;
      return amyeittasote;
    }
    //-------------------------------------------------------------------------
    // Get warameittugyi
    // input: (
    //    md= day of the month [1-30],
    //    wd= weekday  [0=sat, 1=sun, ..., 6=fri])
    // output: ( [1=warameittugyi, 0=else])
    static cal_warameittugyi(md, wd) {
      var mf = md - 15 * Math.floor(md / 16); //get fortnight day [0-15]
      var warameittugyi = 0;
      var wda = [7, 1, 4, 8, 9, 6, 3];
      if (mf == wda[wd]) warameittugyi = 1;
      return warameittugyi;
    }
    //-------------------------------------------------------------------------
    // Get warameittunge
    // input: (
    //    md= day of the month [1-30],
    //    wd= weekday  [0=sat, 1=sun, ..., 6=fri])
    // output: ( [1=warameittunge, 0=else])
    static cal_warameittunge(md, wd) {
      var mf = md - 15 * Math.floor(md / 16); //get fortnight day [0-15]
      var warameittunge = 0;
      var wn = (wd + 6) % 7;
      if (12 - mf == wn) warameittunge = 1;
      return warameittunge;
    }
    //-------------------------------------------------------------------------
    // Get yatpote
    // input: (
    //    md= day of the month [1-30],
    //    wd= weekday  [0=sat, 1=sun, ..., 6=fri])
    // output: ( [1=yatpote, 0=else])
    static cal_yatpote(md, wd) {
      var mf = md - 15 * Math.floor(md / 16); //get fortnight day [0-15]
      var yatpote = 0;
      var wda = [8, 1, 4, 6, 9, 8, 7];
      if (mf == wda[wd]) yatpote = 1;
      return yatpote;
    }
    //-------------------------------------------------------------------------
    // Get thamaphyu
    // input: (
    //    md= day of the month [1-30],
    //    wd= weekday  [0=sat, 1=sun, ..., 6=fri])
    // output: ( [1=thamaphyu, 0=else])
    static cal_thamaphyu(md, wd) {
      var mf = md - 15 * Math.floor(md / 16); //get fortnight day [0-15]
      var thamaphyu = 0;
      var wda = [1, 2, 6, 6, 5, 6, 7];
      if (mf == wda[wd]) thamaphyu = 1;
      var wdb = [0, 1, 0, 0, 0, 3, 3];
      if (mf == wdb[wd]) thamaphyu = 1;
      if (mf == 4 && wd == 5) thamaphyu = 1;
      return thamaphyu;
    }
    //-------------------------------------------------------------------------
    // Get nagapor
    // input: (
    //    md= day of the month [1-30],
    //    wd= weekday  [0=sat, 1=sun, ..., 6=fri])
    // output: ( [1=nagapor, 0=else])
    static cal_nagapor(md, wd) {
      var nagapor = 0;
      var wda = [26, 21, 2, 10, 18, 2, 21];
      if (md == wda[wd]) nagapor = 1;
      var wdb = [17, 19, 1, 0, 9, 0, 0];
      if (md == wdb[wd]) nagapor = 1;
      if ((md == 2 && wd == 1) || ((md == 12 || md == 4 || md == 18) && wd == 2)) nagapor = 1;
      return nagapor;
    }
    //-------------------------------------------------------------------------
    // yatyotema
    // input: (
    //    mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //         Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //         Tabaung=12, Late Tagu=13, Late Kason=14 ],
    //    md= day of the month [1-30])
    // output: ( [1=yatyotema, 0=else])
    static cal_yatyotema(mm, md) {
      var mmt = Math.floor(mm / 13);
      mm = (mm % 13) + mmt; // to 1-12 with month type
      if (mm <= 0) mm = 4; //first waso is considered waso
      var mf = md - 15 * Math.floor(md / 16); //get fortnight day [0-15]
      var yatyotema = 0;
      var m1 = mm % 2 ? mm : (mm + 9) % 12;
      m1 = ((m1 + 4) % 12) + 1;
      if (mf == m1) yatyotema = 1;
      return yatyotema;
    }
    //-------------------------------------------------------------------------
    // mahayatkyan
    // input: (
    //    mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //         Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //         Tabaung=12, Late Tagu=13, Late Kason=14 ],
    //    md= day of the month [1-30])
    // output: ( [1=mahayatkyan, 0=else])
    static cal_mahayatkyan(mm, md) {
      if (mm <= 0) mm = 4; //first waso is considered waso
      var mf = md - 15 * Math.floor(md / 16); //get fortnight day [0-15]
      var mahayatkyan = 0;
      var m1 = ((Math.floor((mm % 12) / 2) + 4) % 6) + 1;
      if (mf == m1) mahayatkyan = 1;
      return mahayatkyan;
    }
    //-------------------------------------------------------------------------
    // shanyat
    // input: (
    //    mm = month [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //         Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //         Tabaung=12, Late Tagu=13, Late Kason=14 ],
    //    md= day of the month [1-30])
    // output: ( [1=shanyat, 0=else])
    static cal_shanyat(mm, md) {
      var mmt = Math.floor(mm / 13);
      mm = (mm % 13) + mmt; // to 1-12 with month type
      if (mm <= 0) mm = 4; //first waso is considered waso
      var mf = md - 15 * Math.floor(md / 16); //get fortnight day [0-15]
      var shanyat = 0;
      var sya = [8, 8, 2, 2, 9, 3, 3, 5, 1, 4, 7, 4];
      if (mf == sya[mm - 1]) shanyat = 1;
      return shanyat;
    }
    //-------------------------------------------------------------------------
    // get astrological information
    // input: (jdn: Julian Day Number)
    // output: (array of strings)
    static cal_astro(jdn) {
      jdn = Math.round(jdn);
      var myt, my, mm, md;
      var hs = [];
      var yo = ceMmDateTime.j2m(jdn);
      myt = yo.myt;
      my = yo.my;
      mm = yo.mm;
      md = yo.md;
      var wd = (jdn + 2) % 7; //week day [0=sat, 1=sun, ..., 6=fri]
      if (ceMmDateTime.cal_thamanyo(mm, wd)) {
        hs.push("Thamanyo");
      }
      if (ceMmDateTime.cal_amyeittasote(md, wd)) {
        hs.push("Amyeittasote");
      }
      if (ceMmDateTime.cal_warameittugyi(md, wd)) {
        hs.push("Warameittugyi");
      }
      if (ceMmDateTime.cal_warameittunge(md, wd)) {
        hs.push("Warameittunge");
      }
      if (ceMmDateTime.cal_yatpote(md, wd)) {
        hs.push("Yatpote");
      }
      if (ceMmDateTime.cal_thamaphyu(md, wd)) {
        hs.push("Thamaphyu");
      }
      if (ceMmDateTime.cal_nagapor(md, wd)) {
        hs.push("Nagapor");
      }
      if (ceMmDateTime.cal_yatyotema(mm, md)) {
        hs.push("Yatyotema");
      }
      if (ceMmDateTime.cal_mahayatkyan(mm, md)) {
        hs.push("Mahayatkyan");
      }
      if (ceMmDateTime.cal_shanyat(mm, md)) {
        hs.push("Shanyat");
      }
      return hs;
    }
    // End of core functions ###############################################################

    //-----------------------------------------------------------------------------
    // Start of checking holidays ##################################################
    //-----------------------------------------------------------------------------
    // Get holidays
    // input: (jdn=Julian Day Number)
    // output: ( array of strings)
    // Thanks to Ye Lin Kyaw and Aye Nyein for the knowledge about
    // the Myanmar calendar and the new year
    static cal_holiday(jdn) {
      jdn = Math.round(jdn);
      var myt, my, mm, md, mp, mmt, gy, gm, gd;
      var yo = ceMmDateTime.j2m(jdn);
      myt = yo.myt;
      my = yo.my;
      mm = yo.mm;
      md = yo.md;
      mp = ceMmDateTime.cal_mp(md, mm, myt);
      mmt = Math.floor(mm / 13);
      var hs = [];
      var go = ceDateTime.j2w(jdn);
      gy = go.y;
      gm = go.m;
      gd = go.d;
      //---------------------------------
      // Thingyan
      var SY = 1577917828.0 / 4320000.0; //solar year (365.2587565)
      var MO = 1954168.050623; //beginning of 0 ME
      var BGNTG = 1100,
        SE3 = 1312; //start of Thingyan and third era
      var akn, atn, ja, jk;
      ja = SY * (my + mmt) + MO; // atat time
      if (my >= SE3) jk = ja - 2.169918982;
      // akya time
      else jk = ja - 2.1675;
      akn = Math.round(jk);
      atn = Math.round(ja);
      if (jdn == atn + 1) {
        hs.push("Myanmar New Year's Day");
      }
      if (my + mmt >= BGNTG) {
        if (jdn == atn) {
          hs.push("Thingyan Atat");
        } else if (jdn > akn && jdn < atn) {
          hs.push("Thingyan Akyat");
        } else if (jdn == akn) {
          hs.push("Thingyan Akya");
        } else if (jdn == akn - 1) {
          hs.push("Thingyan Akyo");
        } else if (my + mmt >= 1369 && my + mmt < 1379 && (jdn == akn - 2 || (jdn >= atn + 2 && jdn <= akn + 7))) {
          hs.push("Holiday");
        }
      }
      //---------------------------------
      // holidays on gregorian calendar
      if (gy >= 2018 && gm == 1 && gd == 1) {
        hs.push("New Year's Day");
      } else if (gy >= 1948 && gm == 1 && gd == 4) {
        hs.push("Independence Day");
      } else if (gy >= 1947 && gm == 2 && gd == 12) {
        hs.push("Union Day");
      } else if (gy >= 1958 && gm == 3 && gd == 2) {
        hs.push("Peasants' Day");
      } else if (gy >= 1945 && gm == 3 && gd == 27) {
        hs.push("Resistance Day");
      } else if (gy >= 1923 && gm == 5 && gd == 1) {
        hs.push("Labour Day");
      } else if (gy >= 1947 && gm == 7 && gd == 19) {
        hs.push("Martyrs' Day");
      } else if (gy >= 1752 && gm == 12 && gd == 25) {
        hs.push("Christmas Day");
      } else if (gy == 2017 && gm == 12 && gd == 30) {
        hs.push("Holiday");
      } else if (gy >= 2017 && gm == 12 && gd == 31) {
        hs.push("Holiday");
      }
      //---------------------------------
      // holidays on myanmar calendar
      if (mm == 2 && mp == 1) {
        hs.push("Buddha Day");
      } //Vesak day
      else if (mm == 4 && mp == 1) {
        hs.push("Start of Buddhist Lent");
      } //Warso day
      else if (mm == 7 && mp == 1) {
        hs.push("End of Buddhist Lent");
      } else if (my >= 1379 && mm == 7 && (md == 14 || md == 16)) {
        hs.push("Holiday");
      } else if (mm == 8 && mp == 1) {
        hs.push("Tazaungdaing");
      } else if (my >= 1379 && mm == 8 && md == 14) {
        hs.push("Holiday");
      } else if (my >= 1282 && mm == 8 && md == 25) {
        hs.push("National Day");
      } else if (mm == 10 && md == 1) {
        hs.push("Karen New Year's Day");
      } else if (mm == 12 && mp == 1) {
        hs.push("Tabaung Pwe");
      }
      //---------------------------------
      // //other holidays
      // var ghEid=[2456513,2456867,2457221,2457576,2457930,2458285,2458640];
      // if(ceMmDateTime.bSearch1(jdn,ghEid)>=0) {hs.push("Eid");}

      // // var ghDiwali=[2456599,2456953,2457337,2457691,2458045,2458430,2458784];
      // // if(ceMmDateTime.bSearch1(jdn,ghDiwali)>=0) {hs.push("Diwali");}
      // if((mm==7) && (mp==3)) {hs.push("~Diwali");}
      //---------------------------------
      return hs;
    }
    //----------------------------------------------------------------------------
    // DoE : Date of Easter using  "Meeus/Jones/Butcher" algorithm
    // Reference: Peter Duffett-Smith, Jonathan Zwart',
    //  "Practical Astronomy with your Calculator or Spreadsheet,"
    //  4th Etd, Cambridge university press, 2011. Page-4.
    // input: (y=year)
    // output: (j=julian day number)
    // dependency: w2j()
    static DoE(y) {
      var a, b, c, d, e, f, g, h, i, k, l, m, p, q, n;
      a = y % 19;
      b = Math.floor(y / 100);
      c = y % 100;
      d = Math.floor(b / 4);
      e = b % 4;
      f = Math.floor((b + 8) / 25);
      g = Math.floor((b - f + 1) / 3);
      h = (19 * a + b - d - g + 15) % 30;
      i = Math.floor(c / 4);
      k = c % 4;
      l = (32 + 2 * e + 2 * i - h - k) % 7;
      m = Math.floor((a + 11 * h + 22 * l) / 451);
      q = h + l - 7 * m + 114;
      p = (q % 31) + 1;
      n = Math.floor(q / 31);
      return Math.round(ceDateTime.w2j(y, n, p, 12, 0, 0, 1)); // this is for Gregorian
    }
    //----------------------------------------------------------------------------
    // Get other holidays
    // input: (jdn: Julian Day Number)
    // output: (array of strings)
    // dependency: DoE(), j2w()
    static cal_holiday2(jdn) {
      jdn = Math.round(jdn);
      var myt, my, mm, md, mp, mmt, gy, gm, gd;
      var yo = ceMmDateTime.j2m(jdn);
      myt = yo.myt;
      my = yo.my;
      mm = yo.mm;
      md = yo.md;
      mp = ceMmDateTime.cal_mp(md, mm, myt);
      mmt = Math.floor(mm / 13);
      var hs = [];
      var go = ceDateTime.j2w(jdn);
      gy = go.y;
      gm = go.m;
      gd = go.d;
      //---------------------------------
      // holidays on gregorian calendar
      var doe = ceMmDateTime.DoE(gy);
      if (gy <= 2017 && gm == 1 && gd == 1) {
        hs.push("New Year's Day");
      } else if (gy >= 1915 && gm == 2 && gd == 13) {
        hs.push("G. Aung San BD");
      } else if (gy >= 1969 && gm == 2 && gd == 14) {
        hs.push("Valentines Day");
      } else if (gy >= 1970 && gm == 4 && gd == 22) {
        hs.push("Earth Day");
      } else if (gy >= 1392 && gm == 4 && gd == 1) {
        hs.push("April Fools' Day");
      } else if (gy >= 1948 && gm == 5 && gd == 8) {
        hs.push("Red Cross Day");
      } else if (gy >= 1994 && gm == 10 && gd == 5) {
        hs.push("World Teachers' Day");
      } else if (gy >= 1947 && gm == 10 && gd == 24) {
        hs.push("United Nations Day");
      } else if (gy >= 1753 && gm == 10 && gd == 31) {
        hs.push("Halloween");
      }
      if (gy >= 1876 && jdn == doe) {
        hs.push("Easter");
      } else if (gy >= 1876 && jdn == doe - 2) {
        hs.push("Good Friday");
      }
      //---------------------------------
      // holidays on myanmar calendar
      if (my >= 1309 && mm == 11 && md == 16) {
        hs.push("Mon National Day");
      } //the ancient founding of Hanthawady
      else if (mm == 9 && md == 1) {
        hs.push("Shan New Year's Day");
        if (my >= 1306) {
          hs.push("Authors' Day");
        }
      } //Nadaw waxing moon 1
      else if (mm == 3 && mp == 1) {
        hs.push("Mahathamaya Day");
      } //Nayon full moon
      else if (mm == 6 && mp == 1) {
        hs.push("Garudhamma Day");
      } //Tawthalin full moon
      else if (my >= 1356 && mm == 10 && mp == 1) {
        hs.push("Mothers' Day");
      } //Pyatho full moon
      else if (my >= 1370 && mm == 12 && mp == 1) {
        hs.push("Fathers' Day");
      } //Tabaung full moon
      else if (mm == 5 && mp == 1) {
        hs.push("Metta Day");
      } //Waguang full moon
      else if (mm == 5 && md == 10) {
        hs.push("Taungpyone Pwe");
      } //Taung Pyone Pwe
      else if (mm == 5 && md == 23) {
        hs.push("Yadanagu Pwe");
      } //Yadanagu Pwe
      //----------------------------------------------------------------------------
      // //other holidays
      // var ghEid2=[2456936,2457290,2457644,2457998,2458353,2458707];
      // var ghCNY=[2456689,2456690,2457073,2457074,2457427,2457428,2457782,
      // 	2457783,2458166,2458167,2458520,2458521];
      // if(ceMmDateTime.bSearch1(jdn,ghEid2)>=0) {hs.push("Eid");}
      // if(ceMmDateTime.bSearch1(jdn,ghCNY)>=0) {hs.push("Chinese New Year's Day");}
      //----------------------------------------------------------------------------
      return hs;
    }

    //-----------------------------------------------------------------------------
    //End of checking holidays ####################################################

    //-------------------------------------------------------------------------
    // jd to date string in Myanmar calendar
    // input: (jd:julian date,
    //  fs: format string [Optional argument: "&y &M &P &ff"]
    //  tz : time zone offset in hours (Optional, e.g. 8 for GMT +8))
    // output: date string in Myanmar calendar according to fm
    // where formatting strings are as follows
    // &yyyy : Myanmar year [0000-9999, e.g. 1380]
    // &YYYY : Sasana year [0000-9999, e.g. 2562]
    // &y : Myanmar year [0-9999, e.g. 138]
    // &mm : month with zero padding [01-14]
    // &M : month [e.g. January]
    // &m : month [1-14]
    // &P : moon phase [e.g. waxing, waning, full moon, or new moon]
    // &dd : day of the month with zero padding [01-31]
    // &d : day of the month [1-31]
    // &ff : fortnight day with zero padding [01-15]
    // &f : fortnight day [1-15]
    static j2ms(jd, fs = "&y &M &P &ff", tz = 0) {
      jd += tz / 24.0;
      var jdn = Math.round(jd);
      var myt, my, mm, md, mp, mf;
      var yo = ceMmDateTime.j2m(jdn);
      myt = yo.myt;
      my = yo.my;
      mm = yo.mm;
      md = yo.md;
      mp = ceMmDateTime.cal_mp(md, mm, myt);
      mf = ceMmDateTime.cal_mf(md);
      var mma = ["First Waso", "Tagu", "Kason", "Nayon", "Waso", "Wagaung", "Tawthalin", "Thadingyut", "Tazaungmon", "Nadaw", "Pyatho", "Tabodwe", "Tabaung", "Late Tagu", "Late Kason"];
      var mpa = ["Waxing", "Full Moon", "Waning", "New Moon"];
      // replace format string with values
      var fm = fs;
      var fstr, rstr, re;
      //--------------------------------------------------------
      fstr = "&yyyy";
      re = new RegExp(fstr, "g");
      rstr = "0000" + my.toString();
      rstr = rstr.substr(rstr.length - 4);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      var sy = my + 1182; //Sasana year
      fstr = "&YYYY";
      re = new RegExp(fstr, "g");
      rstr = "0000" + sy.toString();
      rstr = rstr.substr(rstr.length - 4);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "&y";
      re = new RegExp(fstr, "g");
      rstr = my.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "&mm";
      re = new RegExp(fstr, "g");
      rstr = "00" + mm.toString();
      rstr = rstr.substr(rstr.length - 2);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "&M";
      re = new RegExp(fstr, "g");
      rstr = mma[mm];
      if (mm == 4 && myt > 0) {
        rstr = "Second " + rstr;
      }
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "&m";
      re = new RegExp(fstr, "g");
      rstr = mm.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "&P";
      re = new RegExp(fstr, "g");
      rstr = mpa[mp];
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "&dd";
      re = new RegExp(fstr, "g");
      rstr = "00" + md.toString();
      rstr = rstr.substr(rstr.length - 2);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "&d";
      re = new RegExp(fstr, "g");
      rstr = md.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "&ff";
      re = new RegExp(fstr, "g");
      rstr = "00" + mf.toString();
      rstr = rstr.substr(rstr.length - 2);
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      fstr = "&f";
      re = new RegExp(fstr, "g");
      rstr = mf.toString();
      fm = fm.replace(re, rstr);
      //--------------------------------------------------------
      return fm;
    }
    //-------------------------------------------------------------------------
    // get properties

    // Myanmar year type
    get myt() {
      var yo = ceMmDateTime.j2m(this.jdnl);
      return yo.myt;
    }

    // Myanmar year
    get my() {
      var yo = ceMmDateTime.j2m(this.jdnl);
      return yo.my;
    }

    // Sasana year
    get sy() {
      return this.my + 1182;
    }

    // Myanmar year name
    get my_name() {
      // var yna=["ပုဿနှစ်","မာခနှစ်","ဖ္လကိုန်နှစ်","စယ်နှစ်",
      // 	"ပိသျက်နှစ်","စိဿနှစ်","အာသတ်နှစ်","သရဝန်နှစ်",
      // 	"ဘဒြနှစ်","အာသိန်နှစ်","ကြတိုက်နှစ်","မြိက္ကသိုဝ်နှစ်"];
      var yna = ["Hpusha", "Magha", "Phalguni", "Chitra", "Visakha", "Jyeshtha", "Ashadha", "Sravana", "Bhadrapaha", "Asvini", "Krittika", "Mrigasiras"];
      return yna[this.my % 12];
    }

    // Myanmar month [1-14]
    // [Tagu=1, Kason=2, Nayon=3, 1st Waso=0, (2nd) Waso=4, Wagaung=5,
    //  Tawthalin=6, Thadingyut=7, Tazaungmon=8, Nadaw=9, Pyatho=10, Tabodwe=11,
    //  Tabaung=12, Late Tagu=13, Late Kason=14 ]
    get mm() {
      var yo = ceMmDateTime.j2m(this.jdnl);
      return yo.mm;
    }

    // Myanmar day of the month [1-30]
    get md() {
      var yo = ceMmDateTime.j2m(this.jdnl);
      return yo.md;
    }

    // Moon phase [0=waxing, 1=full moon, 2=waning, 3=new moon]
    get mp() {
      var yo = ceMmDateTime.j2m(this.jdnl);
      return ceMmDateTime.cal_mp(yo.md, yo.mm, yo.myt);
    }

    // Fortnight day [1-15]
    get mf() {
      return ceMmDateTime.cal_mf(this.md);
    }

    // Length of this Myanmar month
    get mmlen() {
      return ceMmDateTime.cal_mml(this.mm, this.myt);
    }

    // get sabbath string
    get sabbath() {
      var yo = ceMmDateTime.j2m(this.jdnl);
      var sb = ceMmDateTime.cal_sabbath(yo.md, yo.mm, yo.myt);
      var str = "";
      if (sb == 1) str = "Sabbath";
      else if (sb == 2) str = "Sabbath Eve";
      return str;
    }

    // get yatyaza string
    get yatyaza() {
      var v = ceMmDateTime.cal_yatyaza(this.mm, this.w);
      return v ? "Yatyaza" : "";
    }

    // get pyathada string
    get pyathada() {
      var v = ceMmDateTime.cal_pyathada(this.mm, this.w);
      var pa = ["", "Pyathada", "Afternoon Pyathada"];
      return pa[v % 3];
    }

    // get nagahle direction
    get nagahle() {
      var v = ceMmDateTime.cal_nagahle(this.mm);
      var pa = ["West", "North", "East", "South"];
      return pa[v % 4];
    }

    // get mahabote
    get mahabote() {
      var v = ceMmDateTime.cal_mahabote(this.my, this.w);
      var pa = ["Binga", "Atun", "Yaza", "Adipati", "Marana", "Thike", "Puti"];
      return pa[v % 7];
    }

    // get nakhat
    get nakhat() {
      var v = ceMmDateTime.cal_nakhat(this.my);
      var pa = ["Ogre", "Elf", "Human"];
      return pa[v % 3];
    }

    // get the array of astrological days
    get astro() {
      return ceMmDateTime.cal_astro(this.jdnl);
    }

    // get the array of public holidays
    get holidays() {
      return ceMmDateTime.cal_holiday(this.jdnl);
    }

    // get the array of other holidays
    get holidays2() {
      return ceMmDateTime.cal_holiday2(this.jdnl);
    }

    //-------------------------------------------------------------------------
    // get Myanmar Date String
    // input: (
    //  fs: format string [Optional argument: "&yyyy &M &P &ff"]
    //  tz : time zone offset in hours (Optional, e.g. 8 for GMT +8))
    // output: date string in Myanmar calendar according to fm
    // where formatting strings are as follows
    // &yyyy : Myanmar year [0000-9999, e.g. 1380]
    // &YYYY : Sasana year [0000-9999, e.g. 2562]
    // &mm : month with zero padding [01-14]
    // &M : month [e.g. Tagu]
    // &m : month [1-14]
    // &P : moon phase [e.g. waxing, waning, full moon, or new moon]
    // &dd : day of the month with zero padding [01-31]
    // &d : day of the month [1-31]
    // &ff : fortnight day with zero padding [01-15]
    // &f : fortnight day [1-15]
    ToMString(fs = "&yyyy &M &P &ff") {
      return ceMmDateTime.j2ms(this.jd, fs, this.tz);
    }
  }

  function mMDStr(M) {
    var str = "",
      tstr = "";

    //month name
    str += M.ToMString("&M");

    //moon phase and day
    tstr = "SecDa";
    if (M.sabbath == "Sabbath") tstr = "SecDaH";
    str += "<p class='" + tstr + "'>";
    str += M.ToMString("&P");
    if (M.mp % 2 == 0) {
      str += " " + M.ToMString("&f");
    }
    str += "</p>";
    return str;
  }

  //*********************************************
  //* modified index.htm of mmcal by @Cuong Dang
  //*********************************************

  var dt = new Date();

  if (isNumber(setthisyear)) {
    dt.setFullYear(Number(setthisyear));
  }

  if (isNumber(setthismonth)) {
    dt.setMonth(Number(setthismonth));
  }

  //User Interface setting
  var uis = {
    Lang: 0, //undefined,//Language 0 = English
    Type: 0, //Gregorian or Julian
    y: dt.getFullYear(),
    m: 1 + dt.getMonth(),
    d: dt.getDate(), //y,m,d to display
    cy: dt.getFullYear(),
    cm: 1 + dt.getMonth(),
    cd: dt.getDate(), //current y,m,d
    BY: 640,
    EY: 2140, //beginning and end of the calendar,
    LT: 1700,
    UT: 2022, //lower and upper threshold for accurate years
  };
  var r,
    i,
    js,
    je,
    eml,
    tstr,
    str = "";
  //------------------------------------------------------------------------
  var Cday = new ceMmDateTime(); // start of month
  Cday.SetTimezone(0);
  Cday.SetDateTime(uis.cy, uis.cm, uis.cd, 12, 0, 0, 0); // time zone is irrelevant
  //------------------------------------------------------------------------
  var MS = new ceMmDateTime(); // start of month
  MS.SetTimezone(0);

  // pnry, we can change year and month here: uis.y, uis.m to calculate other month

  MS.SetDateTime(uis.y, uis.m, 1, 12, 0, 0, 0, uis.Type); // time zone is irrelevant

  sasanaYearNow = MS.ToMString("&YYYY");

  js = MS.jdn; //Find julian day number of start of
  //the month according to calendar type
  eml = MS.mlen; //get the length of the month
  je = js + eml - 1; //Julian day number of end of the month
  var ME = new ceMmDateTime(); // end of month
  ME.SetTimezone(0);
  ME.SetJD(je);
  //-----------------------------------------------------------------------
  r = (MS.w + 6) % 7;
  eml = Math.ceil((eml + r) / 7) * 7;
  var M = new ceMmDateTime(); // end of month
  M.SetTimezone(0);
  M.SetCT(uis.Type);
  for (i = 0; i < eml; i++) {
    //start of checking valid day to display
    if (i >= r && js <= je) {
      M.SetJD(js);
      // M.mp = moon phase [0=waxing, 1=full moon, 2=waning, 3=new moon]
      // M.ToMString: myanmar nth day number

      if (isWidget) {
        switch (M.mp) {
          case 0:
            if (M.sabbath === "Sabbath") str += u_WaxingQuarter + "  " + f2d(i + 1 - r) + u_DateDiv + f2d(uis.cm) + u_DateDiv + uis.cy + ";";
            break;
          case 1:
            str += M.ToMString("&ff") + "th" + u_FMPatimokkha + "  " + f2d(i + 1 - r) + u_DateDiv + f2d(uis.cm) + u_DateDiv + uis.cy + ";";
            break;
          case 2:
            if (M.sabbath === "Sabbath") str += u_WaningQuarter + "  " + f2d(i + 1 - r) + u_DateDiv + f2d(uis.cm) + u_DateDiv + uis.cy + ";";
            break;
          case 3:
            str += M.ToMString("&ff") + "th" + u_NMPatimokkha + "  " + f2d(i + 1 - r) + u_DateDiv + f2d(uis.cm) + u_DateDiv + uis.cy + ";";
            break;
        }
      } else {
        switch (M.mp) {
          // shorter in table (only date)
          case 0:
            if (M.sabbath === "Sabbath") str += f2d(i + 1 - r) + ";";
            break;
          case 1:
            str += M.ToMString("&ff") + "th" + u_FMPatimokkha + "  " + f2d(i + 1 - r) + ";";
            break;
          case 2:
            if (M.sabbath === "Sabbath") str += f2d(i + 1 - r) + ";";
            break;
          case 3:
            str += M.ToMString("&ff") + "th" + u_NMPatimokkha + "  " + f2d(i + 1 - r) + ";";
            break;
        }
      }
      // displaying Myanmar date
      // if (M.my>=2) { str += mMDStr(M); }
      js++; //Julian day number for next day
    } else {
      // Do Nothing
    }
  }

  return str.split(";");
}

/*--------------------------------------------------------------------
 * SunCalc Library
 * ------------------------------------------------------------------*/

/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
 
 
Copyright (c) 2014, Vladimir Agafonkin
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
function returnSunCalc() {
  "use strict";

  // shortcuts for easier to read formulas

  var PI = Math.PI,
    sin = Math.sin,
    cos = Math.cos,
    tan = Math.tan,
    asin = Math.asin,
    atan = Math.atan2,
    acos = Math.acos,
    rad = PI / 180;

  // sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas

  // date/time constants and conversions

  var dayMs = 1000 * 60 * 60 * 24,
    J1970 = 2440588,
    J2000 = 2451545;

  function toJulian(date) {
    return date.valueOf() / dayMs - 0.5 + J1970;
  }
  function fromJulian(j) {
    return new Date((j + 0.5 - J1970) * dayMs);
  }
  function toDays(date) {
    return toJulian(date) - J2000;
  }

  // general calculations for position

  var e = rad * 23.4397; // obliquity of the Earth

  function rightAscension(l, b) {
    return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
  }
  function declination(l, b) {
    return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
  }

  function azimuth(H, phi, dec) {
    return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
  }
  function altitude(H, phi, dec) {
    return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
  }

  function siderealTime(d, lw) {
    return rad * (280.16 + 360.9856235 * d) - lw;
  }

  function astroRefraction(h) {
    if (h < 0)
      // the following formula works for positive altitudes only.
      h = 0; // if h = -0.08901179 a div/0 would occur.

    // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
    // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
  }

  // general sun calculations

  function solarMeanAnomaly(d) {
    return rad * (357.5291 + 0.98560028 * d);
  }

  function eclipticLongitude(M) {
    var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
      P = rad * 102.9372; // perihelion of the Earth

    return M + C + P + PI;
  }

  function sunCoords(d) {
    var M = solarMeanAnomaly(d),
      L = eclipticLongitude(M);

    return {
      dec: declination(L, 0),
      ra: rightAscension(L, 0),
    };
  }

  var SunCalc = {};

  // calculates sun position for a given date and latitude/longitude

  SunCalc.getPosition = function (date, lat, lng) {
    var lw = rad * -lng,
      phi = rad * lat,
      d = toDays(date),
      c = sunCoords(d),
      H = siderealTime(d, lw) - c.ra;

    return {
      azimuth: azimuth(H, phi, c.dec),
      altitude: altitude(H, phi, c.dec),
    };
  };

  // sun times configuration (angle, morning name, evening name)

  var times = (SunCalc.times = [
    [-0.833, "sunrise", "sunset"],
    [-0.3, "sunriseEnd", "sunsetStart"],
    [-6, "dawn", "dusk"],
    [-12, "nauticalDawn", "nauticalDusk"],
    [-18, "nightEnd", "night"],
    [6, "goldenHourEnd", "goldenHour"],
  ]);

  // adds a custom time to the times config

  SunCalc.addTime = function (angle, riseName, setName) {
    times.push([angle, riseName, setName]);
  };

  // calculations for sun times

  var J0 = 0.0009;

  function julianCycle(d, lw) {
    return Math.round(d - J0 - lw / (2 * PI));
  }

  function approxTransit(Ht, lw, n) {
    return J0 + (Ht + lw) / (2 * PI) + n;
  }
  function solarTransitJ(ds, M, L) {
    return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
  }

  function hourAngle(h, phi, d) {
    return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
  }
  function observerAngle(height) {
    return (-2.076 * Math.sqrt(height)) / 60;
  }

  // returns set time for the given sun altitude
  function getSetJ(h, lw, phi, dec, n, M, L) {
    var w = hourAngle(h, phi, dec),
      a = approxTransit(w, lw, n);
    return solarTransitJ(a, M, L);
  }

  // calculates sun times for a given date, latitude/longitude, and, optionally,
  // the observer height (in meters) relative to the horizon

  SunCalc.getTimes = function (date, lat, lng, height) {
    height = height || 0;

    var lw = rad * -lng,
      phi = rad * lat,
      dh = observerAngle(height),
      d = toDays(date),
      n = julianCycle(d, lw),
      ds = approxTransit(0, lw, n),
      M = solarMeanAnomaly(ds),
      L = eclipticLongitude(M),
      dec = declination(L, 0),
      Jnoon = solarTransitJ(ds, M, L),
      i,
      len,
      time,
      h0,
      Jset,
      Jrise;

    var result = {
      solarNoon: fromJulian(Jnoon),
      nadir: fromJulian(Jnoon - 0.5),
    };

    for (i = 0, len = times.length; i < len; i += 1) {
      time = times[i];
      h0 = (time[0] + dh) * rad;

      Jset = getSetJ(h0, lw, phi, dec, n, M, L);
      Jrise = Jnoon - (Jset - Jnoon);

      result[time[1]] = fromJulian(Jrise);
      result[time[2]] = fromJulian(Jset);
    }

    return result;
  };

  // moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

  function moonCoords(d) {
    // geocentric ecliptic coordinates of the moon

    var L = rad * (218.316 + 13.176396 * d), // ecliptic longitude
      M = rad * (134.963 + 13.064993 * d), // mean anomaly
      F = rad * (93.272 + 13.22935 * d), // mean distance
      l = L + rad * 6.289 * sin(M), // longitude
      b = rad * 5.128 * sin(F), // latitude
      dt = 385001 - 20905 * cos(M); // distance to the moon in km

    return {
      ra: rightAscension(l, b),
      dec: declination(l, b),
      dist: dt,
    };
  }

  SunCalc.getMoonPosition = function (date, lat, lng) {
    var lw = rad * -lng,
      phi = rad * lat,
      d = toDays(date),
      c = moonCoords(d),
      H = siderealTime(d, lw) - c.ra,
      h = altitude(H, phi, c.dec),
      // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
      pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));

    h = h + astroRefraction(h); // altitude correction for refraction

    return {
      azimuth: azimuth(H, phi, c.dec),
      altitude: h,
      distance: c.dist,
      parallacticAngle: pa,
    };
  };

  // calculations for illumination parameters of the moon,
  // based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
  // Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.

  SunCalc.getMoonIllumination = function (date) {
    var d = toDays(date || new Date()),
      s = sunCoords(d),
      m = moonCoords(d),
      sdist = 149598000, // distance from Earth to Sun in km
      phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
      inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)),
      angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

    return {
      fraction: (1 + cos(inc)) / 2,
      phase: 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI,
      angle: angle,
    };
  };

  function hoursLater(date, h) {
    return new Date(date.valueOf() + (h * dayMs) / 24);
  }

  // calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article

  SunCalc.getMoonTimes = function (date, lat, lng, inUTC) {
    var t = new Date(date);
    if (inUTC) t.setUTCHours(0, 0, 0, 0);
    else t.setHours(0, 0, 0, 0);

    var hc = 0.133 * rad,
      h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc,
      h1,
      h2,
      rise,
      set,
      a,
      b,
      xe,
      ye,
      d,
      roots,
      x1,
      x2,
      dx;

    // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
    for (var i = 1; i <= 24; i += 2) {
      h1 = SunCalc.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
      h2 = SunCalc.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;

      a = (h0 + h2) / 2 - h1;
      b = (h2 - h0) / 2;
      xe = -b / (2 * a);
      ye = (a * xe + b) * xe + h1;
      d = b * b - 4 * a * h1;
      roots = 0;

      if (d >= 0) {
        dx = Math.sqrt(d) / (Math.abs(a) * 2);
        x1 = xe - dx;
        x2 = xe + dx;
        if (Math.abs(x1) <= 1) roots++;
        if (Math.abs(x2) <= 1) roots++;
        if (x1 < -1) x1 = x2;
      }

      if (roots === 1) {
        if (h0 < 0) rise = i + x1;
        else set = i + x1;
      } else if (roots === 2) {
        rise = i + (ye < 0 ? x2 : x1);
        set = i + (ye < 0 ? x1 : x2);
      }

      if (rise && set) break;

      h0 = h2;
    }

    var result = {};

    if (rise) result.rise = hoursLater(t, rise);
    if (set) result.set = hoursLater(t, set);

    if (!rise && !set) result[ye > 0 ? "alwaysUp" : "alwaysDown"] = true;

    return result;
  };

  var window = window ? window : {};

  // export as Node module / AMD module / browser variable
  if (typeof exports === "object" && typeof module !== "undefined") module.exports = SunCalc;
  else if (typeof define === "function" && define.amd) define(SunCalc);
  else window.SunCalc = SunCalc;

  // pnry added return SunCalc
  return SunCalc;
}

// Do not edit anything beyond this line, it is used for compare new version update
//thisAppVersion=2
