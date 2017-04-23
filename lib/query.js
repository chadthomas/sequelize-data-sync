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

	checkRecordForUpdates: function(targetModel, sourceRecord, targetRecord, key, updatedRecordCallback) {
		var isNewRecord = targetRecord.$options.isNewRecord;
		if(isNewRecord) {
			return targetRecord;
		}

		var recordData = this.getRecordData(targetModel, sourceRecord, key);

		targetRecord.set(recordData);

		var changedKeys = targetRecord.changed();
		if(changedKeys) {
			updatedRecordCallback(targetRecord, changedKeys, isNewRecord);
		}

		return targetRecord;
	},

	getRecordData: function(targetModel, record, key) {
		var recordData = record.get();

		// Remove any target primary keys unless they are our pivot
		targetModel.primaryKeyAttributes.forEach(function(primaryKey) {
			if(primaryKey == key) {
				return;
			}

			delete recordData[primaryKey];
		});

		return recordData;
	},

	getMatchingRelationNames: function(sourceModel, targetModel) {
		var sourceAssociationNames = Object.keys(sourceModel.associations);
		var targetAssociationNames = Object.keys(targetModel.associations);

		return targetAssociationNames
			.filter(function(associationName) {
				return sourceAssociationNames.indexOf(associationName) !== -1;
			});
	},

	getRelationRecords: function(association, sourceRecord, targetRecord, dataCallback) {

		return sourceRecord[association.accessors.get]()
			.then(function(sourceRelationRecords) {

				return targetRecord[association.accessors.get]()
					.then(function(targetRelationRecords) {

						return dataCallback(sourceRelationRecords, targetRelationRecords);
					});
			});
	}

}
