'use strict'

require('array.prototype.find').shim();

var queryHelper = require('./query');

module.exports = {

	_compareModels: function(
		sourceModel,
		targetModel,
		pivotKey,
		idKey,
		newRecordCallback,
		updatedRecordCallback,
		deletedRecordCallback,
		perRecordCallback
	) {
		var self = this;

		return queryHelper._forEachRecord(
			sourceModel,
			function(sourceRecord) {

				// Detect new and changed records
				self._compareRecord(
					sourceRecord,
					targetModel,
					pivotKey,
					idKey,
					newRecordCallback,
					updatedRecordCallback
				)
					.then(function(targetRecord) {
						perRecordCallback(sourceRecord, targetRecord);
					});
			}
		)
			.then(function() {
				/**
				  * Go through each record on the target and make sure we can find it in the source
				  * If we can't find it, it was deleted.
				 **/

				// Detect deleted records
				return queryHelper._forEachRecord(
					targetModel,
					function(targetRecord) {

						queryHelper._findRecordBy(
							sourceModel,
							pivotKey,
							targetRecord[pivotKey]
						)
							.then(function(sourceRecord) {
								if(!sourceRecord) {
									deletedRecordCallback(targetRecord)
								}
							}); 
					}
				);
			});
	},

	_compareRecord: function(sourceRecord, targetModel, pivotKey, idKey, newRecordCallback, updatedRecordCallback) {

		return queryHelper._findRecordBy(targetModel, pivotKey, sourceRecord[pivotKey])
			.then(function(targetRecord) {
				if(!targetRecord) {
					return newRecordCallback(sourceRecord);
				}

				return queryHelper._checkRecordForUpdates(sourceRecord, targetRecord, pivotKey, idKey, updatedRecordCallback);
			});
	},

	_compareRelationRecords: function(
		sourceRecords,
		targetRecords,
		pivotKey,
		idKey,
		newRecordCallback,
		updatedRecordCallback,
		deletedRecordCallback
	) {
		sourceRecords
			.forEach(function(sourceRecord) {

				var targetRecord = targetRecords
					.find(function(targetRecord, index) {
						if(sourceRecord[pivotKey] === targetRecord[pivotKey]) {
							targetRecords.splice(index, 1);
							return true;
						}
					});

				if(!targetRecord) {
					return newRecordCallback(sourceRecord);
				}

				return queryHelper._checkRecordForUpdates(sourceRecord, targetRecord, pivotKey, idKey, updatedRecordCallback);
			});

		/**
		  * We've been removing records from this list as we go through matching with source records
		  * If something still exists here when we've finished then that record was deleted in the source.
		 **/
		targetRecords
			.forEach(function(targetRecord) {
				//Relation deleted
				deletedRecordCallback(targetRecord);
			});
	}
}
