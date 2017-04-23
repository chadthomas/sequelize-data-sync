'use strict'

require('array.prototype.find').shim();

var QueryHelper = require('./query');

module.exports = {

	compareModels: function(
		sourceModel,
		targetModel,
		sourcePivotKey,
		targetPivotKey,
		newRecordCallback,
		updatedRecordCallback,
		deletedRecordCallback,
		perRecordCallback
	) {
		var self = this;

		return QueryHelper.forEachRecord(
			sourceModel,
			function(sourceRecord) {

				// Detect new and changed records
				self.compareRecord(
					sourceRecord,
					targetModel,
					sourcePivotKey,
					targetPivotKey,
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
				return QueryHelper.forEachRecord(
					targetModel,
					function(targetRecord) {

						QueryHelper.findRecordBy(
							sourceModel,
							sourcePivotKey,
							targetRecord[targetPivotKey]
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

	compareRecord: function(sourceRecord, targetModel, sourcePivotKey, targetPivotKey, newRecordCallback, updatedRecordCallback) {

		return QueryHelper.findRecordBy(
			targetModel,
			targetPivotKey,
			sourceRecord[sourcePivotKey]
		)
			.then(function(targetRecord) {
				if(!targetRecord) {
					return newRecordCallback(sourceRecord);
				}

				return QueryHelper.checkRecordForUpdates(
					targetModel,
					sourceRecord,
					targetRecord,
					targetPivotKey,
					updatedRecordCallback
				);//@@STUB
			});
	},

	compareRelationRecords: function(
		targetModel,
		sourceRecords,
		targetRecords,
		sourcePivotKey,
		targetPivotKey,
		newRecordCallback,
		updatedRecordCallback,
		deletedRecordCallback
	) {
		sourceRecords
			.forEach(function(sourceRecord) {

				var targetRecord = targetRecords
					.find(function(targetRecord, index) {

						if(sourceRecord[sourcePivotKey] === targetRecord[targetPivotKey]) {
							targetRecords.splice(index, 1);
							return true;
						}
					});

				if(!targetRecord) {
					return newRecordCallback(sourceRecord);
				}

				return QueryHelper.checkRecordForUpdates(
					targetModel,
					sourceRecord,
					targetRecord,
					targetPivotKey,
					updatedRecordCallback
				);
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
