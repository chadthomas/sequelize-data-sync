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

	findRecordBy: function(model, key, value) {
		var where = {};
		where[key] = value;

		return model.findOne({
			where: where
		});
	},

	checkRecordForUpdates: function(targetModel, key, sourceRecord, targetRecord, updatedRecordCallback) {
		var isNewRecord = targetRecord.$options.isNewRecord;
		if(isNewRecord) {
			return targetRecord;
		}

		var recordData = this.getRecordData(targetModel, key, sourceRecord);

		targetRecord.set(recordData);

		var changedKeys = targetRecord.changed();
		if(changedKeys) {
			updatedRecordCallback(targetRecord, changedKeys, isNewRecord);
		}

		return targetRecord;
	},

	getRecordData: function(targetModel, pivotKey, record) {
		var recordData = record.get();

		// Remove any target primary keys unless they are our pivot
		targetModel.primaryKeyAttributes.forEach(function(primaryKey) {
			if(primaryKey == pivotKey) {
				return;
			}

			delete recordData[primaryKey];
		});

		return recordData;
	},

	getRelationRecords: function(association, sourceRecord, targetRecord, dataCallback) {

		return sourceRecord[association.accessors.get]()
			.then(function(sourceRelationRecords) {

				return targetRecord[association.accessors.get]()
					.then(function(targetRelationRecords) {

						return dataCallback(sourceRelationRecords, targetRelationRecords);
					});
			});
	},

	getAssociations: function(sourceModel, targetModel, options) {
		var sourceAssociationNames = Object.keys(sourceModel.associations);
		var targetAssociationNames = Object.keys(targetModel.associations);

		var associations = [];

		for(var pluralAssociationName in options.include) {
			if(sourceAssociationNames.indexOf(pluralAssociationName) === -1 ||
				targetAssociationNames.indexOf(pluralAssociationName) === -1) {
				
				// If this association does not exist on both models, drop it
				delete options.include[pluralAssociationName];
				return;
			}

			var associationRef = options.include[pluralAssociationName];
			var association = targetModel.associations[pluralAssociationName];

			if(typeof associationRef === 'string') {
				associationRef = {
					sourcePivotKey: associationRef,
					targetPivotKey: associationRef
				};
			}

			var sourcePivotKey = associationRef.sourcePivotKey;
			var targetPivotKey = associationRef.targetPivotKey;

			if(!sourcePivotKey && sourcePivotKey !== true) {
				sourcePivotKey = options.sourcePivotKey;
			}
			if(!targetPivotKey && targetPivotKey !== true) {
				targetPivotKey = options.targetPivotKey;
			}

			associations.push({
				type: association.associationType,
				pluralName: association.options.name,
				singularName: association.options.name.singular,
				sourcePivotKey: sourcePivotKey,
				targetPivotKey: targetPivotKey,
				sourceModel: association.source,
				targetModel: association.target,
				accessors: association.accessors
			});
		}

		return associations;
	}
}
