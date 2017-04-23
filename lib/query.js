'use strict'

module.exports = {

	forEachRecord: function(model, perRecordCallback) {
		var index = 0;

		function getRecord() {
			return model.find({
				offset: index
			})
				.then(function(record) {
					if(!record) {
						return; //End of results
					}

					perRecordCallback(record);
					return getRecord(++index);
				});
		}

		return getRecord();
	},

	findRecordBy: function(targetModel, key, value) {
		var where = {};
		where[key] = value;

		return targetModel.findOne({
			where: where
		});
	},

	checkRecordForUpdates: function(sourceRecord, targetRecord, pivotKey, idKey, updatedRecordCallback) {
		var isNewRecord = targetRecord.$options.isNewRecord;
		if(isNewRecord) {
			return targetRecord;
		}

		var recordData = this.getRecordData(sourceRecord, pivotKey, idKey);
		targetRecord.set(recordData);

		var changedKeys = targetRecord.changed();
		if(changedKeys) {
			updatedRecordCallback(targetRecord, changedKeys, isNewRecord);
		}

		return targetRecord;
	},

	getRecordData: function(record, pivotKey, idKey) {
		var recordData = record.get();

		if(pivotKey !== idKey) {
			delete recordData[idKey];
		}

		return recordData;
	},

	getMatchingRelationNames: function(sourceModel, targetModel) {
		var sourceRelations = Object.keys(sourceModel.associations);
		var targetRelations = Object.keys(targetModel.associations);

		return targetRelations
			.filter(function(relationName) {
				return sourceRelations.indexOf(relationName) !== -1;
			});
	},

	getRelationRecords: function(sourceRecord, targetRecord, association, dataCallback) {
		return sourceRecord[association.accessors.get]()
			.then(function(sourceRelationRecords) {

				return targetRecord[association.accessors.get]()
					.then(function(targetRelationRecords) {

						return dataCallback(sourceRelationRecords, targetRelationRecords);
					});
			});
	}

}
