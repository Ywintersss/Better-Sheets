var listOfGroup = { Ungroup: { sheets: [] } };

const SIDEBAR =
	HtmlService.createHtmlOutputFromFile("index").setTitle("Grouping Sheets");

const SHEETCREATETEMPLATEHTML = HtmlService.createHtmlOutputFromFile(
	"templatedSheetCreate"
).setTitle("Create Sheet from a Template");

// Database Sheet Name
const DATABASE = "DATABASE";

// Spreadsheet obj
const spreadsheet = {
	/**
	 * Returns the Spreadsheet's ID
	 *
	 * @returns {string}
	 */

	getSpreadsheetId() {
		return SpreadsheetApp.getActiveSpreadsheet().getId();
	},

	/**
	 * Returns the active spreadsheet
	 *
	 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
	 */

	getActiveSpreadsheet() {
		return SpreadsheetApp.getActiveSpreadsheet();
	},

	/**
	 * Returns the UI Object
	 *
	 * @returns {GoogleAppsScript.Base.Ui}
	 */

	getEditorUi() {
		return SpreadsheetApp.getUi();
	},

	/**
	 * Returns an array of sheets
	 *
	 * @returns {GoogleAppsScript.Spreadsheet.Sheet[]}
	 */

	getListOfSheets() {
		var sheets = this.getActiveSpreadsheet().getSheets();

		// Get all sheets in the spreadsheet
		return sheets
	},

	/**
	 * Gets the database Sheet
	 *
	 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
	 */

	getDatabaseSheet() {
		var ss = this.getActiveSpreadsheet();
		var sheet = ss.getSheetByName(DATABASE);
		if (!sheet) {
			sheet = ss.insertSheet(DATABASE);
			sheet.hideSheet();
		}
		return sheet;
	},

	/**
	 * Saves the groupings
	 *
	 */

	saveGroups() {
		var sheet = this.getDatabaseSheet();
		sheet.clear(); // Clear existing data
		sheet.getRange(1, 1).setValue(JSON.stringify(listOfGroup));
		Logger.log("saveGroups:");
		Logger.log(listOfGroup);
	},

	/**
	 * Loads the groupings
	 *
	 */

	loadGroups() {
		var sheet = this.getDatabaseSheet();
		var data = sheet.getRange(1, 1).getValue();
		if (data) {
			listOfGroup = JSON.parse(data);
		}

		listOfGroup["Ungroup"] = { sheets: [] };

		// Get all sheets' name in the spreadsheet
		var allSheets = spreadsheet.getListOfSheets();
		var allSheetNames = allSheets.map(function (sheet) {
			return sheet.getName();
		});

		// Get all grouped sheet names
		var groupedSheetNames = [];
		for (var group in listOfGroup) {
			if (listOfGroup.hasOwnProperty(group)) {
				groupedSheetNames = groupedSheetNames.concat(
					listOfGroup[group].sheets
				);
			}
		}

		// Add sheets not in any group to 'Ungroup'
		allSheetNames.forEach(function (sheetName) {
			if (
				groupedSheetNames.indexOf(sheetName) === -1 &&
				sheetName != "DATABASE" &&
				sheetName != "INPUT FORM TEMPLATE" &&
				sheetName != "INCOME STATEMENT TEMPLATE" &&
				!(sheetName in listOfGroup)
			) {
				listOfGroup["Ungroup"]["sheets"].push(sheetName);
			}
		});
	},
};

function onOpen() {
	warning();

	// Load database
	spreadsheet.loadGroups();
	spreadsheet.saveGroups();

	// Create a menu button
	var ui = spreadsheet.getEditorUi();
	ui.createMenu("Better Sheets for Accounting")
		.addItem("Grouping sheets", "openSidebar")
		.addSeparator()
		.addItem("Add a templated sheet", "showTemplateTypeSelectHTML")
		.addToUi();
}

/**
 * Creates a new group
 * 
 */

function createGroup() {
	spreadsheet.loadGroups();

	var ui = spreadsheet.getEditorUi();

	// Prompt group name
	var responseGN = ui.prompt(
		"Create a new group",
		"Enter the new group name",
		ui.ButtonSet.OK_CANCEL
	);

	// Process the user's response.
	if (responseGN.getSelectedButton() == ui.Button.OK) {
		var groupName = responseGN.getResponseText();

		// Validate group name
		if (groupName in listOfGroup) {
			Logger.log("Group name already exist: ", groupName);
			ui.alert(
				"Error",
				"Group name: " + groupName + " already exist!",
				ui.ButtonSet.OK
			);
		} else {
			// Prompt group color
			var responseGC = ui.prompt(
				"Choose a group color",
				"1. Enter a hexadecimal color code (e.g., #FF0000)\n or\n 2. Enter a color name (e.g. red, orange, blue...) ",
				ui.ButtonSet.OK_CANCEL
			);
			if (responseGC.getSelectedButton() == ui.Button.OK) {
				var groupColor = responseGC.getResponseText();
				ui.alert(
					"Success",
					'The group "' + groupName + '" has been added.',
					ui.ButtonSet.OK
				);
				ui.showSidebar(SIDEBAR);

				//add the group into the storage
				listOfGroup[groupName] = listOfGroup[groupName] || {};
				listOfGroup[groupName]["color"] = groupColor;
				listOfGroup[groupName]["sheets"] = [];

				spreadsheet.saveGroups();

				// create a group tab
				createNewSheets(groupName, groupColor);
			}
		}
	}
}

/**
 * Add Sheets to group
 * 
 * @param {Array} list
 */

function addSheetsToGroup(list) {
	spreadsheet.loadGroups();

	var ui = spreadsheet.getEditorUi();

	// if list not empty
	if (list.length > 0) {
		var responseGN = ui.prompt(
			"Add sheet to a group",
			"Enter the group name to be added into",
			ui.ButtonSet.OK_CANCEL
		);
		if (responseGN.getSelectedButton() == ui.Button.OK) {
			var groupName = responseGN.getResponseText();

			if (listOfGroup.hasOwnProperty(groupName)) {
				// Remove sheets from 'Ungroup'
				listOfGroup["Ungroup"]["sheets"] = listOfGroup["Ungroup"][
					"sheets"
				].filter((sheet) => !list.includes(sheet));

				// Add sheets to the specified group
				listOfGroup[groupName]["sheets"] =
					listOfGroup[groupName]["sheets"].concat(list);

				// change the color to the group color & hide the sheets in list
				var groupColor = listOfGroup[groupName]["color"];
				list.forEach((sheetName) => {
					var sheet = spreadsheet
						.getActiveSpreadsheet()
						.getSheetByName(sheetName);
					if (sheet) {
						// Change tab color
						sheet.setTabColor(groupColor);
						// Hide sheet
						sheet.hideSheet();
					}
				});

				spreadsheet.saveGroups();
				ui.alert(
					"Success",
					"Sheets: [" +
						list.join(", ") +
						"] added to group: " +
						groupName,
					ui.ButtonSet.OK
				);
			} else {
				ui.alert(
					"Error",
					"Group name: " + groupName + " does not exist!",
					ui.ButtonSet.OK
				);
			}
		}
	} else {
		ui.alert("Error", "Select at least one sheet!", ui.ButtonSet.OK);
	}
	return listOfGroup;
}

function getListOfGroups() {
	spreadsheet.loadGroups();
	return listOfGroup;
}

function getListOfSheets() {
	spreadsheet.loadGroups();
	const allSheets = spreadsheet.getListOfSheets();
	var sheets = [];
  
	for (let i = 0; i < allSheets.length; i++) {
	  const sheetName = allSheets[i].getName();
	  // Exclude sheets with names in groupNames or named 'DATABASE'
	  if (!listOfGroup.hasOwnProperty(sheetName) && sheetName !== 'DATABASE') {
		sheets.push(sheetName);
	  }
	}
	return sheets;
  }
  

//  Open sidebar
function openSidebar() {
	spreadsheet.loadGroups();
	spreadsheet.saveGroups();
	var ui = spreadsheet.getEditorUi();
	ui.showSidebar(SIDEBAR);
}

// create a new sheet
function createNewSheets(name, color) {
	var ss = spreadsheet.getActiveSpreadsheet();
	var newSheet = ss.insertSheet(name);

	if (color) {
		newSheet.setTabColor(color);
	}
}

function setupTrigger_onChange() {
	ScriptApp.newTrigger("onChange")
		.forSpreadsheet(SpreadsheetApp.getActive())
		.onChange()
		.create();
}

function onChange(e) {
	// if user added a sheet
	if (e.changeType === "INSERT_GRID") {
		// refresh the html
		openSidebar();
	}
}

function warning() {
	var ui = spreadsheet.getEditorUi();
	var feature = [
		"",
		"Create a new group.",
		"Multi-select ungroup sheets and move them to a group.",
		"Click on the group name will show all the sheets for the group at the sheet bar.",
		"At the right of each group name, you can edit(rename & color), ungroup and delete the group.",
		"Click on the sheet name will show the sheet.",
		"At the right of each sheet name, you can rename, ungroup(remove from a group) and delete the sheet.",
	];
	ui.alert(
		"Important Messages using Group-Sheets",
		"Warning: Due to limitation of Google App Script, DO NOT DELETE or RENAME sheets from the sheet bar at the bottom of your screen. DO so only from THIS SIDEBAR, or else everything will MESSED UP.\n\nFeatures: " +
			feature.join("\n - "),
		ui.ButtonSet.OK
	);
}

function setActiveSheet(sheetName) {
	var ui = spreadsheet.getEditorUi();
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = ss.getSheetByName(sheetName);
	if (sheet) {
		sheet.showSheet();
		ss.setActiveSheet(sheet);
	} else {
		ui.alert("Error", "Sheet: " + sheetName + " does not exist!", ui.ButtonSet.OK);
	}
}

// for sheet tab
function unhideAndMoveSheets(groupName) {
	spreadsheet.loadGroups();
	var ss = spreadsheet.getActiveSpreadsheet();

	var group = listOfGroup[groupName];

	if (!group || !group.sheets) {
		Logger.log("Group not found or no sheets in the group: " + groupName);
		return;
	}

	// Hide all sheets except the group tabs
	var listOfSheets = ss.getSheets();
	listOfSheets.forEach((sheet) => {
		var sheetName = sheet.getName();
		if (
			listOfGroup.hasOwnProperty(sheetName) ||
			listOfGroup["Ungroup"]["sheets"].includes(sheetName)
		) {
			sheet.showSheet();
		} else {
			sheet.hideSheet();
		}
	});

	// Unhide and move sheets in the group
	group.sheets.forEach((sheetName, index) => {
		var sheet = ss.getSheetByName(sheetName);
		if (sheet) {
			sheet.showSheet();
			ss.setActiveSheet(sheet);
			ss.moveActiveSheet(1 + index); // Move each sheet to the leftmost position
		}
	});

	// Move the group tab itself to the leftmost position
	var groupSheet = ss.getSheetByName(groupName);
	if (groupSheet) {
		groupSheet.showSheet();
		ss.setActiveSheet(groupSheet);
		ss.moveActiveSheet(1);
	}
}

/**
 * Renames the sheet
 * 
 * @param {string} groupName
 * @param {string} sheetName
 */

function renameSheet(groupName, sheetName) {
	spreadsheet.loadGroups();
	var ui = spreadsheet.getEditorUi();
	var response = ui.prompt(
		"Rename a sheet",
		"Enter the new sheet name",
		ui.ButtonSet.OK_CANCEL
	);

	// Process the user's response.
	if (response.getSelectedButton() == ui.Button.OK) {
		var newName = response.getResponseText().trim();

		// Check if the new name exists as a group name
		if (listOfGroup.hasOwnProperty(newName)) {
			ui.alert(
				"Error",
				'The name: "' +
					newName +
					'" already exists as a group. Please enter another name.',
				ui.ButtonSet.OK
			);
			return;
		}

		// Check if the new name exists as a sheet
		var ss = spreadsheet.getActiveSpreadsheet();
		var sheet = ss.getSheetByName(newName);
		if (sheet) {
			ui.alert(
				"Error",
				'The name: "' +
					newName +
					'" already exists as a sheet. Please enter another name.',
				ui.ButtonSet.OK
			);
			return;
		}

		// Get the sheet by sheetName
		var sheetToRename = ss.getSheetByName(sheetName);
		if (sheetToRename) {
			// Rename it with newName
			sheetToRename.setName(newName);

			// update database
			var index = listOfGroup[groupName].sheets.indexOf(sheetName);
			listOfGroup[groupName].sheets[index] = newName;

			spreadsheet.saveGroups();
			ui.alert(
				"Success",
				'The sheet has been renamed to "' + newName + '".',
				ui.ButtonSet.OK
			);
			openSidebar();
		}
	}
}

/**
 * Ungroups the sheet from the group
 * 
 * @param {string} groupName
 * @param {string} sheetName
 */

function ungroupSheet(groupName, sheetName) {
	spreadsheet.loadGroups();
	var ui = spreadsheet.getEditorUi();
	var response = ui.alert(
		"Confirmation",
		'Are you sure you want to remove from group for sheet: "' +
			sheetName +
			'"?',
		ui.ButtonSet.YES_NO
	);

	// Process the user's response.
	if (response == ui.Button.YES) {
		var ss = spreadsheet.getActiveSpreadsheet();
		var sheet = ss.getSheetByName(sheetName);

		// Remove sheet from the group in listOfGroup
		if (listOfGroup[groupName]) {
			var index = listOfGroup[groupName].sheets.indexOf(sheetName);
			if (index > -1) {
				listOfGroup[groupName].sheets.splice(index, 1);
			}
		}
		sheet.setTabColor(null);

		spreadsheet.saveGroups();
		ui.alert(
			"Success",
			'The sheet has been removed from group "' + groupName + '".',
			ui.ButtonSet.OK
		);
		openSidebar();
	}
}

/**
 * Delete the sheet from the group
 * 
 * @param {string} groupName
 * @param {string} sheetName
 */

function deleteSheet(groupName, sheetName) {
	spreadsheet.loadGroups();
	var ui = spreadsheet.getEditorUi();
	var response = ui.alert(
		"Confirmation",
		'Are you sure you want to delete sheet: "' + sheetName + '"?',
		ui.ButtonSet.YES_NO
	);

	// Process the user's response.
	if (response == ui.Button.YES) {
		var ss = spreadsheet.getActiveSpreadsheet();
		var sheet = ss.getSheetByName(sheetName);

		if (sheet) {
			// Delete from spreadsheet
			// add try catch so that it wont delete sheet if this is the last sheet exist in spreadsheet
			try {
				ss.deleteSheet(sheet);
			} catch (error) {
				ui.alert("Error", error.message, ui.ButtonSet.YES_NO);
				return;
			}

			// Delete from listOfGroup
			if (listOfGroup[groupName]) {
				var index = listOfGroup[groupName].sheets.indexOf(sheetName);
				if (index > -1) {
					listOfGroup[groupName].sheets.splice(index, 1);
				}
			}
		}
		spreadsheet.saveGroups();
		ui.alert(
			"Success",
			'The sheet "' + sheetName + '" has been deleted.',
			ui.ButtonSet.OK
		);
		openSidebar();
	}
}

/**
 * Edit the group name
 * 
 * @param {string} groupName 
 */

function editGroup(groupName) {
	spreadsheet.loadGroups();
	var ui = spreadsheet.getEditorUi();
	var responseGN = ui.prompt(
		"Rename a group",
		"Enter the new group name",
		ui.ButtonSet.OK_CANCEL
	);

	// Process the user's response.
	if (responseGN.getSelectedButton() == ui.Button.OK) {
		var newName = responseGN.getResponseText().trim();

		// Check if the new name exists as a group name
		if (listOfGroup.hasOwnProperty(newName)) {
			ui.alert(
				"Error",
				'The name: "' +
					newName +
					'" already exists as a group. Please enter another name.',
				ui.ButtonSet.OK
			);
			return;
		}

		// Check if the new name exists as a sheet
		var ss = spreadsheet.getActiveSpreadsheet();
		var sheet = ss.getSheetByName(newName);
		if (sheet) {
			ui.alert(
				"Error",
				'The name: "' +
					newName +
					'" already exists as a sheet. Please enter another name.',
				ui.ButtonSet.OK
			);
			return;
		}

		var responseGC = ui.prompt(
			"Change group color",
			"Enter the new group color",
			ui.ButtonSet.OK_CANCEL
		);
		if (responseGC.getSelectedButton() == ui.Button.OK) {
			var newColor = responseGC.getResponseText();

			// Get the sheet by groupName
			var sheetToRename = ss.getSheetByName(groupName);
			if (sheetToRename) {
				// Rename it with newName
				sheetToRename.setName(newName);
				sheetToRename.setTabColor(newColor);

				// update database
				listOfGroup[newName] = listOfGroup[groupName];
				delete listOfGroup[groupName];
				listOfGroup[newName]["color"] = newColor;

				// change the sheet tab color for all the sheets in the list
				var sheetsInGroup = listOfGroup[newName]["sheets"];
				sheetsInGroup.forEach((sheetName) => {
					var sheet = ss.getSheetByName(sheetName);
					if (sheet) {
						sheet.setTabColor(newColor);
					}
				});

				spreadsheet.saveGroups();
				ui.alert(
					"Success",
					"The group has been edited.",
					ui.ButtonSet.OK_CANCEL
				);
				openSidebar();
			}
		}
	}
}

/**
 * Ungroup the group
 * 
 * @param {string} groupName 
 */

function ungroupGroup(groupName) {
	spreadsheet.loadGroups();
	var ui = spreadsheet.getEditorUi();
	var response = ui.alert(
		"Confirmation",
		'Are you sure you want to ungroup for : "' +
			groupName +
			'"? (including the sheets inside)',
		ui.ButtonSet.YES_NO
	);

	// Process the user's response.
	if (response == ui.Button.YES) {
		var ss = spreadsheet.getActiveSpreadsheet();

		// Set sheet tab color to null for all sheets in listOfGroup.groupName.sheets
		listOfGroup[groupName].sheets.forEach((sheetName) => {
			var sheet = ss.getSheetByName(sheetName);
			if (sheet) {
				sheet.setTabColor(null);
			}
		});

		// Delete the sheet tab with name: groupName from spreadsheet
		var groupSheet = ss.getSheetByName(groupName);
		if (groupSheet) {
			ss.deleteSheet(groupSheet);
		}

		// Delete groupName from listOfGroup
		delete listOfGroup[groupName];
		spreadsheet.saveGroups();
		ui.alert(
			"Success",
			'The group "' + groupName + '" has been ungrouped.',
			ui.ButtonSet.OK_CANCEL
		);
		openSidebar();
	}
}

/**
 * Delete groups from the database
 * 
 * @param {string} groupName
 */

function deleteGroup(groupName) {
	spreadsheet.loadGroups();
	var ui = spreadsheet.getEditorUi();
	var response = ui.alert(
		"Confirmation",
		'Are you sure you want to delete group: "' +
			groupName +
			'"? (including the sheets inside)',
		ui.ButtonSet.YES_NO
	);

	// Process the user's response.
	if (response == ui.Button.YES) {
		var ss = spreadsheet.getActiveSpreadsheet();
		var group = listOfGroup[groupName];

		// To avoid deleting all sheets in spreadsheet
		if (groupName == "Ungroup") {
			if (ss.getSheets().length - group.sheets.length < 2) {
				ui.alert(
					"Error",
					"You can't remove all the visible sheets in a document.",
					ui.ButtonSet.OK
				);
				return;
			}
		} else {
			if (ss.getSheets().length - 1 - group.sheets.length < 2) {
				ui.alert(
					"Error",
					"You can't remove all the visible sheets in a document.",
					ui.ButtonSet.OK
				);
				return;
			}
		}

		if (group.sheets) {
			// Delete all sheets inside the group from the spreadsheet
			group.sheets.forEach((sheetName) => {
				var sheet = ss.getSheetByName(sheetName);
				if (sheet) {
					ss.deleteSheet(sheet);
				}
			});
		}
		// Delete group tab
		var groupSTab = ss.getSheetByName(groupName);
		if (groupSTab) {
			ss.deleteSheet(groupSTab);
		}
		// Delete the group from database
		delete listOfGroup[groupName];

		spreadsheet.saveGroups();
		ui.alert(
			"Success",
			'The group "' + groupName + '" has been deleted.',
			ui.ButtonSet.OK
		);
		openSidebar();
	}
}

/**
 * Shows the HTML for choosing the template type
 *
 */

function showTemplateTypeSelectHTML() {
	var ui = spreadsheet.getEditorUi();

	ui.showSidebar(SHEETCREATETEMPLATEHTML);
}

/**
 * Creates the templated sheet
 *
 * @param {Array} inputFormFields
 */

function createTemplatedSheet(inputFormFields, templateName) {
	var ui = spreadsheet.getEditorUi();

	var header = ui.prompt(
		"Statement Header",
		"Enter the main title of the statement",
		ui.ButtonSet.OK_CANCEL
	);

	// Process the user's response.
	if (header.getSelectedButton() == ui.Button.OK) {
		while (true) {
			var period = ui.prompt(
				"Statement Period",
				"Enter the period for this sheet (Yearly or Monthly)",
				ui.ButtonSet.OK_CANCEL
			);

			if (period.getSelectedButton() == ui.Button.OK) {
				if (
					period.getResponseText() != "Yearly" &&
					period.getResponseText() != "Monthly"
				) {
					ui.alert("Invalid input");
				} else {
					break;
				}
			}
		}

		switch (templateName) {
			case "INCOME_STATEMENT":
				let ss = spreadsheet.getActiveSpreadsheet();
				if (
					ss.getSheetByName("Income Statement Input Form") ||
					ss.getSheetByName("Income Statement")
				) {
					let ui = spreadsheet.getEditorUi();

					ui.alert("Sheets already created");
					return;
				}
				let inputFormTemplate = ss.getSheetByName(
					"INPUT FORM TEMPLATE"
				);
				let incomeStatementTemplate = ss.getSheetByName(
					"INCOME STATEMENT TEMPLATE"
				);

				if (inputFormFields.length != 0) {
					ss.insertSheet({ template: inputFormTemplate })
						.setName("Income Statement Input Form")
						.getRange(
							1,
							inputFormTemplate.getLastColumn(),
							inputFormTemplate.getLastRow(),
							inputFormFields.length
						)
						.insertCells(SpreadsheetApp.Dimension.COLUMNS);
				} else {
					ss.insertSheet({ template: inputFormTemplate }).setName(
						"Income Statement Input Form"
					);
				}

				ss.insertSheet({ template: incomeStatementTemplate }).setName(
					"Income Statement"
				);

				SpreadsheetApp.flush();

				let newSheet = ss.getSheetByName("Income Statement Input Form");

				if (inputFormFields.length != 0) {
					newSheet
						.getRange(
							1,
							newSheet.getLastColumn() - inputFormFields.length,
							1,
							inputFormFields.length
						)
						.setValues([inputFormFields]);
				}

				let reportStatement = ss.getSheetByName("Income Statement");

				reportStatement
					.getRange("C3")
					.setValue(header.getResponseText());

				reportStatement
					.getRange("E5")
					.setValue(period.getResponseText())
					.setHorizontalAlignment("right");
				break;
		}
	} else if (header.getSelectedButton() == ui.Button.CANCEL) {
		Logger.log("The user didn't want to provide a name.");
		return;
	} else {
		Logger.log(
			"The user clicked the close button in the dialog's title bar."
		);
		return;
	}
}
export {
	deleteGroup,
	ungroupGroup,
	editGroup,
	deleteSheet,
	ungroupSheet,
	renameSheet,
	unhideAndMoveSheets,
	setActiveSheet,
	getListOfGroups,
	getListOfSheets,
	warning,
	onChange,
	onOpen,
	setupTrigger_onChange,
	addSheetsToGroup,
	openSidebar,
	createGroup,
	createNewSheets,
	showTemplateTypeSelectHTML,
	createTemplatedSheet,
};
