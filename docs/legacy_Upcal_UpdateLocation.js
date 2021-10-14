// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: map-marker-alt;

/*---------------------------------------------------------------------
 * Upcal - https://github.com/vpnry/upcal
 * Cuong DANG @ 2020 - Upcal is released under the MIT License too
 * Description: Uposatha calendar and dawn time widget
 * File: Upcal_UpdateLocation.js
 * File birthday: 12 Nov 2020
 * Last modified: 07 Dec 2020
 * -------------------------------------------------------------------*/

/*---------------------------------------------------------------------
  TIPS:
   When Scriptable is trying to get location, if an ERROR something like 'kCLErrorDomain error 0.' occurs:
   SOLUTION: try opening the Maps app (by Apple) or your other trusted map apps)
   and let Maps successfully locate your location just before doing this update step!
 ----------------------------------------------------------------------*/
const UPDATEMARK = "/*AUTO_UPDATE_MARK_DO_NOT_ED1T_THIS_L1NE*/";
const pnryUposatha = "Upcal_Widget.js";
const BACKUPFIRST = false;

let fm = FileManager.local();
fm = fm.isFileStoredIniCloud(module.filename) ? FileManager.iCloud() : fm;

await getLocationWithScriptable();

async function getLocationWithScriptable() {
  let alex2 = new Alert();
  alex2.title = "Turn On Location Service";
  alex2.message =
    "\nMake sure:\n1. Location Service (turned on) in iPad/iPhone: Setting->Privacy.\n2. Allow location access for Scriptable.\n\nIf an error 'kCLErrorDomain error 0.' occurs: try openning the Maps app (by Apple or your other trusted map apps) and let Maps successfully locate your location just before doing this update step!\n\nIt may take up to a minute to detect...";

  alex2.addAction("Yes, I have done these steps->");
  alex2.addCancelAction("No, Stop");
  let iid = await alex2.presentAlert();
  if (iid == -1) {
    console.log("Cancelled");
    return;
  }

  //---------------------------------------
  let locationObject = await Location.current();
  if (locationObject.latitude) {
    let locationString = JSON.stringify(locationObject);
    let alex3 = new Alert();
    alex3.title = "Location Located Successfully";
    alex3.message =
      "\nCurrent location: \n" +
      locationString +
      "\n\nGive a SHORT NAME for this location:\n";
    alex3.addTextField("NEW PLACE NAME?", "NEW PLACE NAME?");
    alex3.addAction("Update...");
    alex3.addCancelAction("Cancel");
    let idx = await alex3.presentAlert();
    if (idx == -1) {
      console.log("Cancelled");
      return;
    }

    let nameValue = alex3.textFieldValue(0);
    nameValue = (nameValue + "").toUpperCase();
    locationObject["locationNAME"] = nameValue;

    // locationObject = {
    //   latitude: number,
    //   longitude: number,
    //   altitude: number,
    //   locationNAME: "String like My House?",
    //   horizontalAccuracy: number,
    //   verticalAccuracy: number,
    // }

    writeUpdate(pnryUposatha, locationObject);
  } else {
    let alex3 = new Alert();
    alex3.title = "Location Detection Failed";
    alex3.message = "Please try again";
    alex3.addCancelAction("Exit");
    let idx = await alex3.presentAlert();
    if (idx == -1) {
      console.log("No location is detected, cancelled");
      return;
    }
  }
  return;
}

async function writeUpdate(pnryUposatha, locaOb) {
  let filePath = fm.joinPath(fm.documentsDirectory(), pnryUposatha);
  let backupDirPath = fm.joinPath(fm.documentsDirectory(), "_UpcalBackup");
  let backupName = Date.now() + "_" + pnryUposatha;

  if (!fm.fileExists(backupDirPath)) {
    if (BACKUPFIRST) {
      fm.createDirectory(backupDirPath);
    }
  }

  let filePathBackup = fm.joinPath(backupDirPath, backupName);

  if (!fm.fileExists(filePath)) {
    console.log("File " + pnryUposatha + " does not exist.");
    let alex3 = new Alert();
    alex3.title = "File Not Found";
    alex3.message = `File: + ${pnryUposatha} + " does not exist! Do not rename it!\nUpdate cancelled!`;
    alex3.addCancelAction("Exit");
    let idx = await alex3.presentAlert();
    if (idx == -1) {
      console.log("File does not exist, cancelled!");
      return;
    }
    return;
  } else {
    let oldCode = await fm.readString(filePath);
    let locaNameStr = "`" + locaOb.locationNAME + "`";
    let lastUpdate = new Date() + "";

    let updateStr = `
/*AUTO_UPDATE_MARK_DO_NOT_ED1T_THIS_L1NE*/


const LATITUDE = ${locaOb.latitude} 
const LONGTITUDE = ${locaOb.longitude}
const nameTHISPLACE_AS = ${locaNameStr}
const ALTITUDE = ${locaOb.altitude} // if you don't know altitude just use: 0

// Last location updated on: ${lastUpdate}

/*AUTO_UPDATE_MARK_DO_NOT_ED1T_THIS_L1NE*/

`;
    let codeFileAry = oldCode.split(UPDATEMARK);
    let newCode = codeFileAry[0] + updateStr + codeFileAry[2];

    if (BACKUPFIRST) {
      fm.writeString(filePathBackup, oldCode);
    }
    fm.writeString(filePath, newCode);

    let aleDone = new Alert();
    aleDone.title = "Successfully Updated New Location";
    aleDone.message = `Location updated for ${locaNameStr} \n\n Welcome to ${locaNameStr}!`;

    aleDone.addCancelAction("Done");
    let idx = await aleDone.presentAlert();
    if (idx == -1) {
      console.log("Updating Finished For " + locaNameStr);
      console.log("May you be well and happy");
      return;
    }
  }
  return;
}
